"""
Tobii Pro Fusion Eye Tracking Service
Handles connection and real-time gaze data from Tobii Pro Fusion
"""
import tobii_research as tr
import time
import threading
from typing import Optional, Dict, List, Callable
import json
from dataclasses import dataclass
from collections import deque


@dataclass
class GazeData:
    """Structure for gaze data"""
    timestamp: float
    left_eye_x: Optional[float]
    left_eye_y: Optional[float]
    right_eye_x: Optional[float]
    right_eye_y: Optional[float]
    validity_left: bool
    validity_right: bool
    screen_width: int = 1920
    screen_height: int = 1080


class TobiiEyeTrackingService:
    def __init__(self):
        self.eyetracker: Optional[tr.EyeTracker] = None
        self.is_connected = False
        self.is_tracking = False
        self.gaze_data_buffer = deque(maxlen=100)  # Keep last 100 gaze points
        self.current_image_path: Optional[str] = None
        self.gaze_callbacks: List[Callable] = []
        self._lock = threading.Lock()
        
    def find_and_connect_eyetracker(self) -> bool:
        """Find and connect to Tobii Pro Fusion"""
        try:
            print("🔍 Searching for Tobii eye trackers...")
            eyetrackers = tr.find_all_eyetrackers()
            
            if not eyetrackers:
                print("❌ No eye trackers found")
                return False
                
            # Use the first available eye tracker (should be Tobii Pro Fusion)
            self.eyetracker = eyetrackers[0]
            self.is_connected = True
            
            print(f"✅ Connected to: {self.eyetracker.model} ({self.eyetracker.device_name})")
            print(f"📍 Address: {self.eyetracker.address}")
            print(f"🔢 Serial: {self.eyetracker.serial_number}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error connecting to eye tracker: {e}")
            self.is_connected = False
            return False
    
    def start_tracking(self) -> bool:
        """Start real-time gaze data collection"""
        if not self.is_connected or not self.eyetracker:
            print("❌ Eye tracker not connected")
            return False
            
        try:
            print("🎯 Starting gaze data tracking...")
            self.eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, self._gaze_data_callback)
            self.is_tracking = True
            print("✅ Gaze tracking started successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error starting gaze tracking: {e}")
            return False
    
    def stop_tracking(self) -> bool:
        """Stop gaze data collection"""
        if not self.eyetracker:
            return False
            
        try:
            print("⏸️ Stopping gaze data tracking...")
            self.eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, self._gaze_data_callback)
            self.is_tracking = False
            print("✅ Gaze tracking stopped")
            return True
            
        except Exception as e:
            print(f"❌ Error stopping gaze tracking: {e}")
            return False
    
    def _gaze_data_callback(self, gaze_data):
        """Callback function for processing gaze data"""
        try:
            # Debug: Print raw gaze data occasionally
            if hasattr(self, '_debug_counter'):
                self._debug_counter += 1
            else:
                self._debug_counter = 1
            
            if self._debug_counter == 1:  # Print on first call to understand the format
                print(f"🔍 Raw gaze data type: {type(gaze_data)}")
                print(f"🔍 Raw gaze data attributes: {dir(gaze_data)}")
                print(f"🔍 Raw gaze data sample: {gaze_data}")
                
                # Try to understand the structure
                if hasattr(gaze_data, '__dict__'):
                    print(f"🔍 Gaze data dict: {gaze_data.__dict__}")
            
            # Check if this is our own GazeData object (wrong callback)
            if hasattr(gaze_data, 'timestamp') and hasattr(gaze_data, 'left_eye_x'):
                print("⚠️ Received our own GazeData object - callback loop detected!")
                return
            
            # Extract gaze data from Tobii GazeData object format
            try:
                # Access the left_eye and right_eye attributes
                left_eye_data = gaze_data.left_eye
                right_eye_data = gaze_data.right_eye
                
                # Extract gaze point on display area and validity
                left_eye_point = left_eye_data.gaze_point.position_on_display_area
                right_eye_point = right_eye_data.gaze_point.position_on_display_area
                left_validity = left_eye_data.gaze_point.validity
                right_validity = right_eye_data.gaze_point.validity
                
                # Extract coordinates (should be tuples with (x, y))
                left_eye = (left_eye_point[0], left_eye_point[1])
                right_eye = (right_eye_point[0], right_eye_point[1])
                
                if self._debug_counter <= 3:  # Print first few samples to verify
                    print(f"👁️ Left eye: {left_eye}, validity: {left_validity}")
                    print(f"👁️ Right eye: {right_eye}, validity: {right_validity}")
                
            except (TypeError, AttributeError) as e:
                print(f"❌ Failed to extract gaze data: {e}")
                if hasattr(gaze_data, 'left_eye'):
                    print(f"🔍 Left eye data: {gaze_data.left_eye}")
                    if hasattr(gaze_data.left_eye, 'gaze_point'):
                        print(f"🔍 Left gaze point: {gaze_data.left_eye.gaze_point}")
                return
            
            # Convert to screen coordinates (assuming 1920x1080, adjust as needed)
            screen_width = 1920
            screen_height = 1080
            
            # Calculate screen coordinates
            # Check if validity is True (not just truthy)
            left_valid = left_validity == True
            right_valid = right_validity == True
            
            left_x = left_eye[0] * screen_width if left_valid else None
            left_y = left_eye[1] * screen_height if left_valid else None
            right_x = right_eye[0] * screen_width if right_valid else None
            right_y = right_eye[1] * screen_height if right_valid else None
            
            # Debug valid gaze points
            if left_valid or right_valid:
                if self._debug_counter % 50 == 0:  # Print every 50th valid sample
                    print(f"👁️ Valid gaze: Left({left_x}, {left_y}) Right({right_x}, {right_y})")
                    
            # Create GazeData object with corrected validity flags
            processed_gaze = GazeData(
                timestamp=time.time(),
                left_eye_x=left_x,
                left_eye_y=left_y,
                right_eye_x=right_x,
                right_eye_y=right_y,
                validity_left=left_valid,
                validity_right=right_valid,
                screen_width=screen_width,
                screen_height=screen_height
            )
            
            # Store in buffer
            with self._lock:
                self.gaze_data_buffer.append(processed_gaze)
            
            # Call any registered callbacks
            for callback in self.gaze_callbacks:
                try:
                    callback(processed_gaze)
                except Exception as e:
                    print(f"⚠️ Error in gaze callback: {e}")
                    
        except Exception as e:
            print(f"❌ Error processing gaze data: {e}")
            import traceback
            traceback.print_exc()
    
    def get_latest_gaze_data(self, count: int = 1) -> List[Dict]:
        """Get the latest gaze data points"""
        with self._lock:
            if not self.gaze_data_buffer:
                return []
            
            # Get the last 'count' items
            latest_data = list(self.gaze_data_buffer)[-count:]
            
            # Convert to dictionaries for JSON serialization
            return [
                {
                    'timestamp': gaze.timestamp,
                    'left_eye_x': gaze.left_eye_x,
                    'left_eye_y': gaze.left_eye_y,
                    'right_eye_x': gaze.right_eye_x,
                    'right_eye_y': gaze.right_eye_y,
                    'validity_left': gaze.validity_left,
                    'validity_right': gaze.validity_right,
                    'screen_width': gaze.screen_width,
                    'screen_height': gaze.screen_height
                }
                for gaze in latest_data
            ]
    
    def get_current_gaze_position(self) -> Optional[Dict]:
        """Get the most recent valid gaze position"""
        latest_data = self.get_latest_gaze_data(1)
        if not latest_data:
            return None
            
        gaze = latest_data[0]
        
        # Check for valid data and non-None values
        left_valid = (gaze['validity_left'] and 
                     gaze['left_eye_x'] is not None and 
                     gaze['left_eye_y'] is not None)
        right_valid = (gaze['validity_right'] and 
                      gaze['right_eye_x'] is not None and 
                      gaze['right_eye_y'] is not None)
        
        # Use the better eye (or average if both valid)
        if left_valid and right_valid:
            # Both eyes valid - use average
            x = (gaze['left_eye_x'] + gaze['right_eye_x']) / 2
            y = (gaze['left_eye_y'] + gaze['right_eye_y']) / 2
        elif left_valid:
            # Only left eye valid
            x = gaze['left_eye_x']
            y = gaze['left_eye_y']
        elif right_valid:
            # Only right eye valid
            x = gaze['right_eye_x']
            y = gaze['right_eye_y']
        else:
            # No valid data
            return None
        
        # Ensure coordinates are within reasonable bounds
        if x < 0 or y < 0 or x > 3840 or y > 2160:  # Max reasonable screen size
            print(f"⚠️ Gaze coordinates out of bounds: x={x}, y={y}")
            return None
        
        return {
            'x': round(x, 1),
            'y': round(y, 1),
            'timestamp': gaze['timestamp']
        }
    
    def set_image_context(self, image_path: str):
        """Set the current image being viewed for context"""
        self.current_image_path = image_path
        print(f"🖼️ Image context set to: {image_path}")
    
    def add_gaze_callback(self, callback: Callable):
        """Add a callback function for real-time gaze data"""
        self.gaze_callbacks.append(callback)
    
    def remove_gaze_callback(self, callback: Callable):
        """Remove a gaze data callback"""
        if callback in self.gaze_callbacks:
            self.gaze_callbacks.remove(callback)
    
    def get_status(self) -> Dict:
        """Get current status of the eye tracking service"""
        return {
            'connected': self.is_connected,
            'tracking': self.is_tracking,
            'eyetracker_model': self.eyetracker.model if self.eyetracker else None,
            'device_name': self.eyetracker.device_name if self.eyetracker else None,
            'current_image': self.current_image_path,
            'buffer_size': len(self.gaze_data_buffer) if self.gaze_data_buffer else 0
        }
    
    def disconnect(self):
        """Disconnect from eye tracker"""
        if self.is_tracking:
            self.stop_tracking()
        
        self.eyetracker = None
        self.is_connected = False
        self.gaze_data_buffer.clear()
        print("🔌 Disconnected from eye tracker")


# Global instance
_tobii_service = None

def get_tobii_eye_tracking_service() -> TobiiEyeTrackingService:
    """Get the global Tobii eye tracking service instance"""
    global _tobii_service
    if _tobii_service is None:
        _tobii_service = TobiiEyeTrackingService()
    return _tobii_service
