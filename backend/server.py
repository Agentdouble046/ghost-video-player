from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
import json
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return str(v)


# Track/Audio Models
class TrackMetadata(BaseModel):
    title: str
    artist: Optional[str] = "Unknown Artist"
    album: Optional[str] = "Unknown Album"
    genre: Optional[str] = None
    year: Optional[int] = None
    duration: Optional[float] = 0
    bitrate: Optional[int] = None
    sampleRate: Optional[int] = None
    fileSize: Optional[int] = 0
    format: Optional[str] = None
    lyrics: Optional[str] = None
    comment: Optional[str] = None


class Track(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    uri: str  # base64 or file path
    type: str = "audio"  # audio or video
    metadata: TrackMetadata
    artwork: Optional[str] = None  # base64 image
    folder: Optional[str] = None
    dateAdded: datetime = Field(default_factory=datetime.utcnow)
    playCount: int = 0
    lastPlayed: Optional[datetime] = None
    isFavorite: bool = False
    rating: Optional[int] = None


class TrackCreate(BaseModel):
    uri: str
    type: str = "audio"
    metadata: TrackMetadata
    artwork: Optional[str] = None
    folder: Optional[str] = None


class TrackUpdate(BaseModel):
    metadata: Optional[TrackMetadata] = None
    artwork: Optional[str] = None
    isFavorite: Optional[bool] = None
    rating: Optional[int] = None


# Playlist Models
class Playlist(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    artwork: Optional[str] = None
    trackIds: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    trackCount: int = 0


class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    artwork: Optional[str] = None


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    artwork: Optional[str] = None
    trackIds: Optional[List[str]] = None


# Queue Models
class QueueItem(BaseModel):
    trackId: str
    position: int
    addedAt: datetime = Field(default_factory=datetime.utcnow)


class Queue(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Default Queue"
    items: List[QueueItem] = []
    currentIndex: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# History Models
class HistoryEntry(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    trackId: str
    playedAt: datetime = Field(default_factory=datetime.utcnow)
    duration: float = 0
    completionPercentage: float = 0


# Download Models
class Download(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    title: str
    type: str = "audio"  # audio or video
    status: str = "pending"  # pending, downloading, completed, failed
    progress: float = 0
    filePath: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None


class DownloadCreate(BaseModel):
    url: str
    title: str
    type: str = "audio"


# Settings Models
class AppSettings(BaseModel):
    id: Optional[str] = "app_settings"
    theme: str = "dark"
    dynamicTheming: bool = True
    crossfadeDuration: int = 0
    replayGain: bool = False
    skipSilence: bool = False
    showWaveform: bool = True
    minimumTrackDuration: int = 30
    minimumFileSize: int = 0
    excludedFolders: List[str] = []
    artistSeparators: List[str] = [";", "/", ","]
    genreSeparators: List[str] = [";", "/", ","]
    enableBackgroundPlay: bool = True
    enableVideoPlayback: bool = True
    enableSubtitles: bool = True
    defaultPlaybackSpeed: float = 1.0
    enableGestures: bool = True


# ==================== ROUTES ====================

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Media Player API", "version": "1.0.0"}


# Track routes
@api_router.post("/tracks", response_model=Track)
async def create_track(track_data: TrackCreate):
    """Create a new track"""
    track = Track(**track_data.dict())
    result = await db.tracks.insert_one(track.dict())
    return track


@api_router.get("/tracks", response_model=List[Track])
async def get_tracks(
    sort_by: Optional[str] = Query(None),
    filter_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get all tracks with optional filtering and sorting"""
    query = {}
    
    if filter_type:
        query["type"] = filter_type
    
    if search:
        query["$or"] = [
            {"metadata.title": {"$regex": search, "$options": "i"}},
            {"metadata.artist": {"$regex": search, "$options": "i"}},
            {"metadata.album": {"$regex": search, "$options": "i"}}
        ]
    
    sort_field = "dateAdded"
    sort_direction = -1
    
    if sort_by == "title":
        sort_field = "metadata.title"
        sort_direction = 1
    elif sort_by == "artist":
        sort_field = "metadata.artist"
        sort_direction = 1
    elif sort_by == "playCount":
        sort_field = "playCount"
        sort_direction = -1
    
    tracks = await db.tracks.find(query).sort(sort_field, sort_direction).to_list(10000)
    return [Track(**track) for track in tracks]


@api_router.get("/tracks/{track_id}", response_model=Track)
async def get_track(track_id: str):
    """Get a specific track"""
    track = await db.tracks.find_one({"id": track_id})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return Track(**track)


@api_router.patch("/tracks/{track_id}", response_model=Track)
async def update_track(track_id: str, track_update: TrackUpdate):
    """Update a track"""
    update_data = {k: v for k, v in track_update.dict().items() if v is not None}
    
    if update_data:
        await db.tracks.update_one(
            {"id": track_id},
            {"$set": update_data}
        )
    
    track = await db.tracks.find_one({"id": track_id})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return Track(**track)


@api_router.delete("/tracks/{track_id}")
async def delete_track(track_id: str):
    """Delete a track"""
    result = await db.tracks.delete_one({"id": track_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"message": "Track deleted successfully"}


@api_router.post("/tracks/{track_id}/play")
async def increment_play_count(track_id: str):
    """Increment play count for a track"""
    await db.tracks.update_one(
        {"id": track_id},
        {
            "$inc": {"playCount": 1},
            "$set": {"lastPlayed": datetime.utcnow()}
        }
    )
    return {"message": "Play count incremented"}


# Album routes
@api_router.get("/albums")
async def get_albums():
    """Get all albums"""
    pipeline = [
        {
            "$group": {
                "_id": "$metadata.album",
                "artist": {"$first": "$metadata.artist"},
                "artwork": {"$first": "$artwork"},
                "trackCount": {"$sum": 1},
                "tracks": {"$push": "$$ROOT"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    albums = await db.tracks.aggregate(pipeline).to_list(10000)
    return albums


@api_router.get("/albums/{album_name}/tracks")
async def get_album_tracks(album_name: str):
    """Get all tracks in an album"""
    tracks = await db.tracks.find({"metadata.album": album_name}).to_list(1000)
    return [Track(**track) for track in tracks]


# Artist routes
@api_router.get("/artists")
async def get_artists():
    """Get all artists"""
    pipeline = [
        {
            "$group": {
                "_id": "$metadata.artist",
                "trackCount": {"$sum": 1},
                "albums": {"$addToSet": "$metadata.album"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    artists = await db.tracks.aggregate(pipeline).to_list(10000)
    return artists


@api_router.get("/artists/{artist_name}/tracks")
async def get_artist_tracks(artist_name: str):
    """Get all tracks by an artist"""
    tracks = await db.tracks.find({"metadata.artist": artist_name}).to_list(1000)
    return [Track(**track) for track in tracks]


# Genre routes
@api_router.get("/genres")
async def get_genres():
    """Get all genres"""
    pipeline = [
        {"$match": {"metadata.genre": {"$ne": None}}},
        {
            "$group": {
                "_id": "$metadata.genre",
                "trackCount": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    genres = await db.tracks.aggregate(pipeline).to_list(10000)
    return genres


@api_router.get("/genres/{genre_name}/tracks")
async def get_genre_tracks(genre_name: str):
    """Get all tracks in a genre"""
    tracks = await db.tracks.find({"metadata.genre": genre_name}).to_list(1000)
    return [Track(**track) for track in tracks]


# Playlist routes
@api_router.post("/playlists", response_model=Playlist)
async def create_playlist(playlist_data: PlaylistCreate):
    """Create a new playlist"""
    playlist = Playlist(**playlist_data.dict())
    await db.playlists.insert_one(playlist.dict())
    return playlist


@api_router.get("/playlists", response_model=List[Playlist])
async def get_playlists():
    """Get all playlists"""
    playlists = await db.playlists.find().to_list(1000)
    return [Playlist(**playlist) for playlist in playlists]


@api_router.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str):
    """Get a specific playlist"""
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(**playlist)


@api_router.patch("/playlists/{playlist_id}", response_model=Playlist)
async def update_playlist(playlist_id: str, playlist_update: PlaylistUpdate):
    """Update a playlist"""
    update_data = {k: v for k, v in playlist_update.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    if "trackIds" in update_data:
        update_data["trackCount"] = len(update_data["trackIds"])
    
    await db.playlists.update_one(
        {"id": playlist_id},
        {"$set": update_data}
    )
    
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return Playlist(**playlist)


@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Delete a playlist"""
    result = await db.playlists.delete_one({"id": playlist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted successfully"}


@api_router.post("/playlists/{playlist_id}/tracks/{track_id}")
async def add_track_to_playlist(playlist_id: str, track_id: str):
    """Add a track to a playlist"""
    playlist = await db.playlists.find_one({"id": playlist_id})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    await db.playlists.update_one(
        {"id": playlist_id},
        {
            "$addToSet": {"trackIds": track_id},
            "$set": {"updatedAt": datetime.utcnow()},
            "$inc": {"trackCount": 1}
        }
    )
    return {"message": "Track added to playlist"}


@api_router.delete("/playlists/{playlist_id}/tracks/{track_id}")
async def remove_track_from_playlist(playlist_id: str, track_id: str):
    """Remove a track from a playlist"""
    await db.playlists.update_one(
        {"id": playlist_id},
        {
            "$pull": {"trackIds": track_id},
            "$set": {"updatedAt": datetime.utcnow()},
            "$inc": {"trackCount": -1}
        }
    )
    return {"message": "Track removed from playlist"}


# Queue routes
@api_router.post("/queue", response_model=Queue)
async def create_or_update_queue(queue_data: Queue):
    """Create or update the current queue"""
    queue_data.updatedAt = datetime.utcnow()
    await db.queue.update_one(
        {"id": queue_data.id},
        {"$set": queue_data.dict()},
        upsert=True
    )
    return queue_data


@api_router.get("/queue", response_model=Queue)
async def get_current_queue():
    """Get the current queue"""
    queue = await db.queue.find_one()
    if not queue:
        # Create default queue
        default_queue = Queue()
        await db.queue.insert_one(default_queue.dict())
        return default_queue
    return Queue(**queue)


# History routes
@api_router.post("/history", response_model=HistoryEntry)
async def add_history_entry(entry: HistoryEntry):
    """Add a history entry"""
    await db.history.insert_one(entry.dict())
    return entry


@api_router.get("/history", response_model=List[HistoryEntry])
async def get_history(limit: int = Query(100)):
    """Get playback history"""
    entries = await db.history.find().sort("playedAt", -1).limit(limit).to_list(limit)
    return [HistoryEntry(**entry) for entry in entries]


@api_router.get("/history/stats")
async def get_listening_stats():
    """Get listening statistics"""
    # Most played tracks
    most_played = await db.tracks.find().sort("playCount", -1).limit(10).to_list(10)
    
    # Total play time
    total_entries = await db.history.count_documents({})
    
    return {
        "mostPlayed": [Track(**track) for track in most_played],
        "totalPlays": total_entries
    }


# Downloads routes
@api_router.post("/downloads", response_model=Download)
async def create_download(download_data: DownloadCreate):
    """Create a new download"""
    download = Download(**download_data.dict())
    await db.downloads.insert_one(download.dict())
    return download


@api_router.get("/downloads", response_model=List[Download])
async def get_downloads():
    """Get all downloads"""
    downloads = await db.downloads.find().sort("createdAt", -1).to_list(1000)
    return [Download(**download) for download in downloads]


@api_router.patch("/downloads/{download_id}")
async def update_download(download_id: str, status: str, progress: float):
    """Update download progress"""
    update_data = {"status": status, "progress": progress}
    if status == "completed":
        update_data["completedAt"] = datetime.utcnow()
    
    await db.downloads.update_one(
        {"id": download_id},
        {"$set": update_data}
    )
    return {"message": "Download updated"}


# Settings routes
@api_router.get("/settings", response_model=AppSettings)
async def get_settings():
    """Get app settings"""
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings:
        default_settings = AppSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return AppSettings(**settings)


@api_router.patch("/settings", response_model=AppSettings)
async def update_settings(settings_update: Dict[str, Any]):
    """Update app settings"""
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": settings_update},
        upsert=True
    )
    settings = await db.settings.find_one({"id": "app_settings"})
    return AppSettings(**settings)


# Search route
@api_router.get("/search")
async def search(q: str = Query(...)):
    """Global search across tracks, albums, artists"""
    tracks = await db.tracks.find({
        "$or": [
            {"metadata.title": {"$regex": q, "$options": "i"}},
            {"metadata.artist": {"$regex": q, "$options": "i"}},
            {"metadata.album": {"$regex": q, "$options": "i"}},
            {"metadata.lyrics": {"$regex": q, "$options": "i"}}
        ]
    }).limit(50).to_list(50)
    
    return {
        "tracks": [Track(**track) for track in tracks]
    }


# YouTube Download routes
@api_router.post("/youtube/search")
async def search_youtube(query: str = Query(...)):
    """Search YouTube videos"""
    try:
        import yt_dlp
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch10:{query}", download=False)
            
            videos = []
            if result and 'entries' in result:
                for entry in result['entries']:
                    if entry:
                        videos.append({
                            'id': entry.get('id'),
                            'title': entry.get('title'),
                            'thumbnail': entry.get('thumbnail'),
                            'duration': entry.get('duration'),
                            'channel': entry.get('channel'),
                            'url': f"https://www.youtube.com/watch?v={entry.get('id')}"
                        })
            
            return {"results": videos}
    except Exception as e:
        logger.error(f"YouTube search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/youtube/info")
async def get_youtube_info(url: str = Query(...)):
    """Get YouTube video info"""
    try:
        import yt_dlp
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            return {
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'description': info.get('description'),
                'channel': info.get('channel'),
                'formats': [
                    {
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'quality': f.get('quality'),
                        'filesize': f.get('filesize'),
                    }
                    for f in info.get('formats', [])[:10]
                ]
            }
    except Exception as e:
        logger.error(f"YouTube info error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/youtube/download")
async def download_youtube(url: str, format_type: str = "audio"):
    """Download YouTube video/audio"""
    try:
        import yt_dlp
        from pathlib import Path
        
        download_path = Path("/tmp/downloads")
        download_path.mkdir(exist_ok=True)
        
        if format_type == "audio":
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': str(download_path / '%(title)s.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }
        else:
            ydl_opts = {
                'format': 'best[ext=mp4]',
                'outtmpl': str(download_path / '%(title)s.%(ext)s'),
            }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Create track entry
            track_data = {
                'uri': filename,
                'type': 'audio' if format_type == 'audio' else 'video',
                'metadata': {
                    'title': info.get('title'),
                    'artist': info.get('channel'),
                    'duration': info.get('duration'),
                }
            }
            
            await db.tracks.insert_one(track_data)
            
            return {"message": "Downloaded successfully", "filename": filename}
    except Exception as e:
        logger.error(f"YouTube download error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Color extraction route
@api_router.post("/artwork/colors")
async def extract_colors(image_base64: str):
    """Extract dominant colors from artwork"""
    try:
        from PIL import Image
        import io
        import base64
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        image = Image.open(io.BytesIO(image_data))
        image = image.resize((150, 150))
        
        # Get colors
        pixels = list(image.getdata())
        
        # Simple color extraction (get most common colors)
        from collections import Counter
        color_counts = Counter(pixels)
        most_common = color_counts.most_common(5)
        
        colors = [f"#{r:02x}{g:02x}{b:02x}" for (r, g, b), _ in most_common]
        
        return {"colors": colors, "primary": colors[0] if colors else "#1DB954"}
    except Exception as e:
        logger.error(f"Color extraction error: {str(e)}")
        return {"colors": ["#1DB954"], "primary": "#1DB954"}


# Audio analysis routes
@api_router.get("/audio/waveform/{track_id}")
async def get_waveform(track_id: str):
    """Generate waveform data for track"""
    try:
        track = await db.tracks.find_one({"id": track_id})
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Generate mock waveform data (in production, use actual audio analysis)
        import random
        waveform = [random.randint(20, 100) for _ in range(200)]
        
        return {"waveform": waveform}
    except Exception as e:
        logger.error(f"Waveform generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
