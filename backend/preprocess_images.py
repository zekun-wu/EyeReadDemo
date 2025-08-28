#!/usr/bin/env python3
"""
Pre-processing script to run SAM segmentation on all images and save results.
This script will generate segmented objects for all images in the pictures folder
and save them to a structured format for quick loading during runtime.
"""

import os
import sys
import json
import time
import numpy as np
import cv2
import torch
from pathlib import Path
from typing import Dict, List, Any
import pickle
import base64

# Add the current directory to Python path to import SAM modules
sys.path.append(os.path.dirname(__file__))

# Import SAM components
try:
    from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
    SAM_AVAILABLE = True
    print("✅ SAM modules imported successfully")
except ImportError as e:
    print(f"❌ Failed to import SAM modules: {e}")
    print("Please ensure segment_anything is properly installed")
    SAM_AVAILABLE = False
    sys.exit(1)


class ImagePreprocessor:
    """Pre-processes images with SAM segmentation and saves results"""
    
    def __init__(self, sam_checkpoint_path: str = "./model/sam_vit_h_4b8939.pth"):
        """Initialize the preprocessor with SAM model"""
        self.sam_checkpoint = sam_checkpoint_path
        self.predictor = None
        self.mask_generator = None
        self.sam_device = None
        
        # Create output directories
        self.output_dir = Path("./segmented_objects")
        self.output_dir.mkdir(exist_ok=True)
        
        self._initialize_sam()
    
    def _initialize_sam(self):
        """Initialize SAM model and mask generator"""
        try:
            if not os.path.exists(self.sam_checkpoint):
                raise FileNotFoundError(f"SAM checkpoint not found at {self.sam_checkpoint}")
            
            model_type = "vit_h"
            
            # Check device availability
            cuda_available = torch.cuda.is_available()
            device = "cuda" if cuda_available else "cpu"
            
            print(f"🔧 SAM Configuration:")
            print(f"   Model: {model_type} (ViT-Huge)")
            print(f"   Checkpoint: {self.sam_checkpoint}")
            print(f"   CUDA Available: {cuda_available}")
            print(f"   Device: {device}")
            
            if cuda_available:
                gpu_name = torch.cuda.get_device_name(0)
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                print(f"   GPU: {gpu_name}")
                print(f"   GPU Memory: {gpu_memory:.1f} GB")
            
            # Load model
            print("   Loading SAM model...")
            sam = sam_model_registry[model_type](checkpoint=self.sam_checkpoint)
            sam.to(device=device)
            
            # Initialize automatic mask generator with optimized settings
            self.mask_generator = SamAutomaticMaskGenerator(
                sam,
                points_per_side=32,  # Dense grid for comprehensive coverage
                pred_iou_thresh=0.86,  # Quality threshold
                stability_score_thresh=0.92,  # Stability threshold
                crop_n_layers=1,
                crop_n_points_downscale_factor=2,
                min_mask_region_area=100,  # Minimum area to avoid tiny segments
            )
            
            self.sam_device = device
            
            print(f"✅ SAM model loaded successfully on {device.upper()}")
            print(f"✅ Auto-segmentation generator initialized")
            
        except Exception as e:
            print(f"❌ Error initializing SAM: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _process_masks(self, masks: List[Dict], image_filename: str) -> Dict[str, Any]:
        """Process masks and convert to storable format"""
        processed_objects = {}
        
        print(f"   Processing {len(masks)} masks...")
        
        for i, mask_data in enumerate(masks):
            # Create unique object ID
            object_id = f"{image_filename}_obj_{i:04d}"
            
            # Extract mask and metadata
            mask = mask_data['segmentation']  # Boolean mask
            bbox = mask_data['bbox']  # [x, y, width, height]
            area = mask_data['area']
            predicted_iou = mask_data['predicted_iou']
            stability_score = mask_data['stability_score']
            
            # Calculate center point
            center_x = bbox[0] + bbox[2] / 2
            center_y = bbox[1] + bbox[3] / 2
            
            # Convert bbox to [x1, y1, x2, y2] format
            bbox_xyxy = [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]]
            
            # Store object data
            processed_objects[object_id] = {
                'object_id': object_id,
                'bbox': bbox_xyxy,
                'area': int(area),
                'center': [int(center_x), int(center_y)],
                'predicted_iou': float(predicted_iou),
                'stability_score': float(stability_score),
                'mask_shape': mask.shape,
                # Convert mask to uint8 for storage efficiency
                'mask': mask.astype(np.uint8)
            }
        
        # Sort by area (largest first) for better visualization
        sorted_objects = dict(sorted(
            processed_objects.items(), 
            key=lambda x: x[1]['area'], 
            reverse=True
        ))
        
        return sorted_objects
    
    def process_image(self, image_path: str) -> bool:
        """Process a single image with SAM segmentation"""
        try:
            image_filename = os.path.basename(image_path)
            image_name = os.path.splitext(image_filename)[0]
            
            print(f"\n🖼️  Processing: {image_filename}")
            
            # Check if already processed
            output_file = self.output_dir / f"{image_name}_segmentation.pkl"
            if output_file.exists():
                print(f"   ⏭️  Already processed, skipping...")
                return True
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                print(f"   ❌ Failed to load image: {image_path}")
                return False
            
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            print(f"   📏 Image shape: {image_rgb.shape}")
            
            # Generate masks
            print(f"   🔄 Running SAM segmentation (this may take 5-15 seconds)...")
            start_time = time.time()
            
            masks = self.mask_generator.generate(image_rgb)
            
            end_time = time.time()
            print(f"   ⏱️  Segmentation completed in {end_time - start_time:.2f} seconds")
            print(f"   🎯 Generated {len(masks)} objects")
            
            # Process and save masks
            processed_objects = self._process_masks(masks, image_name)
            
            # Save processed data
            with open(output_file, 'wb') as f:
                pickle.dump(processed_objects, f)
            
            # Also save a JSON summary for easy inspection
            summary_file = self.output_dir / f"{image_name}_summary.json"
            summary_data = {
                'image_filename': image_filename,
                'total_objects': len(processed_objects),
                'processing_time': end_time - start_time,
                'timestamp': time.time(),
                'objects': []
            }
            
            for obj_id, obj_data in processed_objects.items():
                summary_data['objects'].append({
                    'object_id': obj_id,
                    'bbox': obj_data['bbox'],
                    'area': obj_data['area'],
                    'center': obj_data['center'],
                    'predicted_iou': obj_data['predicted_iou'],
                    'stability_score': obj_data['stability_score'],
                    'mask_shape': obj_data['mask_shape']
                })
            
            with open(summary_file, 'w') as f:
                json.dump(summary_data, f, indent=2)
            
            print(f"   ✅ Saved to: {output_file}")
            print(f"   📊 Summary: {summary_file}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error processing {image_path}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def process_all_images(self, images_dir: str = "../pictures"):
        """Process all images in the given directory"""
        images_path = Path(images_dir)
        
        if not images_path.exists():
            print(f"❌ Images directory not found: {images_dir}")
            return
        
        # Find all image files
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(images_path.glob(f"*{ext}"))
            image_files.extend(images_path.glob(f"*{ext.upper()}"))
        
        if not image_files:
            print(f"❌ No image files found in {images_dir}")
            return
        
        print(f"🚀 Starting batch processing of {len(image_files)} images...")
        print(f"📁 Input directory: {images_path.absolute()}")
        print(f"📁 Output directory: {self.output_dir.absolute()}")
        
        successful = 0
        failed = 0
        total_start_time = time.time()
        
        for i, image_file in enumerate(image_files, 1):
            print(f"\n{'='*60}")
            print(f"Processing image {i}/{len(image_files)}")
            
            if self.process_image(str(image_file)):
                successful += 1
            else:
                failed += 1
        
        total_time = time.time() - total_start_time
        
        print(f"\n{'='*60}")
        print(f"🎉 Batch processing completed!")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"⏱️  Total time: {total_time:.2f} seconds")
        print(f"📊 Average time per image: {total_time/len(image_files):.2f} seconds")
        print(f"📁 Results saved in: {self.output_dir.absolute()}")
    
    def load_image_objects(self, image_name: str) -> Dict[str, Any]:
        """Load pre-processed objects for a given image"""
        output_file = self.output_dir / f"{image_name}_segmentation.pkl"
        
        if not output_file.exists():
            print(f"❌ No pre-processed data found for {image_name}")
            return {}
        
        try:
            with open(output_file, 'rb') as f:
                objects = pickle.load(f)
            
            print(f"✅ Loaded {len(objects)} objects for {image_name}")
            return objects
            
        except Exception as e:
            print(f"❌ Error loading objects for {image_name}: {e}")
            return {}


def main():
    """Main function to run the preprocessing"""
    print("🎯 SAM Image Preprocessing Tool")
    print("="*60)
    
    if not SAM_AVAILABLE:
        print("❌ SAM not available, exiting...")
        return
    
    try:
        # Initialize preprocessor
        preprocessor = ImagePreprocessor()
        
        # Process all images
        preprocessor.process_all_images()
        
        print("\n🎉 Preprocessing completed successfully!")
        print("You can now use the pre-processed segmentation data in your application.")
        
    except Exception as e:
        print(f"❌ Error during preprocessing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
