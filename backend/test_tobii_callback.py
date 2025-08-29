"""
Test script to understand Tobii callback format
"""
import tobii_research as tr
import time

def simple_gaze_callback(gaze_data):
    """Simple callback to understand the data format"""
    print(f"🔍 Type: {type(gaze_data)}")
    print(f"🔍 Data: {gaze_data}")
    
    if hasattr(gaze_data, 'keys'):
        print(f"🔍 Keys: {list(gaze_data.keys())}")
    else:
        print(f"🔍 Attributes: {dir(gaze_data)}")
    
    if hasattr(gaze_data, '__dict__'):
        print(f"🔍 Dict: {gaze_data.__dict__}")
    
    print("="*50)

def test_tobii_callback():
    """Test the basic Tobii callback"""
    try:
        # Find eye tracker
        eyetrackers = tr.find_all_eyetrackers()
        if not eyetrackers:
            print("❌ No eye trackers found")
            return
        
        eyetracker = eyetrackers[0]
        print(f"✅ Found: {eyetracker.model}")
        
        # Subscribe to gaze data
        print("🎯 Starting gaze data subscription...")
        eyetracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, simple_gaze_callback)
        
        # Collect for 5 seconds
        print("👁️ Collecting gaze data for 5 seconds...")
        time.sleep(5)
        
        # Unsubscribe
        print("⏸️ Stopping...")
        eyetracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, simple_gaze_callback)
        print("✅ Done")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_tobii_callback()
