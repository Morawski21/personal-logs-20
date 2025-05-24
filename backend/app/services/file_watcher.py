import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from typing import Callable, Optional
import logging

logger = logging.getLogger(__name__)

class ExcelFileHandler(FileSystemEventHandler):
    """Handle Excel file changes"""
    
    def __init__(self, callback: Callable, file_patterns: list = None):
        self.callback = callback
        self.file_patterns = file_patterns or ['*.xlsx', '*.xls']
        
    def on_modified(self, event):
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # Check if it's an Excel file we care about
        if any(file_path.match(pattern) for pattern in self.file_patterns):
            logger.info(f"Excel file modified: {file_path}")
            # Use asyncio to run the callback
            asyncio.create_task(self.callback(file_path))
            
class FileWatcher:
    """Watch Excel files for changes and trigger updates"""
    
    def __init__(self, watch_directory: str, callback: Callable):
        self.watch_directory = Path(watch_directory)
        self.callback = callback
        self.observer: Optional[Observer] = None
        
    def start(self):
        """Start watching for file changes"""
        if self.observer is not None:
            return  # Already watching
            
        self.observer = Observer()
        event_handler = ExcelFileHandler(self.callback)
        
        self.observer.schedule(
            event_handler, 
            str(self.watch_directory), 
            recursive=False
        )
        
        self.observer.start()
        logger.info(f"Started watching directory: {self.watch_directory}")
        
    def stop(self):
        """Stop watching for file changes"""
        if self.observer is not None:
            self.observer.stop()
            self.observer.join()
            self.observer = None
            logger.info("Stopped file watching")
            
    def __del__(self):
        self.stop()