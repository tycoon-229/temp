"use client";

import * as RadixSlider from "@radix-ui/react-slider";

const Slider = ({ value = 0, max = 1, onChange }) => {
  
  const handleChange = (newValue) => {
    onChange?.(newValue[0]);
  };

  // Nếu max = 1 (Volume) thì bước nhảy nhỏ, ngược lại (Seek) bước nhảy 1
  const step = max === 1 ? 0.01 : 1;

  return (
    <RadixSlider.Root
      className="relative flex items-center select-none touch-none w-full h-10 cursor-pointer group"
      defaultValue={[0]}
      value={[value]}
      onValueChange={handleChange}
      max={max}
      step={step}
      aria-label="Volume"
    >
      {/* TRACK: Thanh nền xám */}
      <RadixSlider.Track 
        className="
          relative grow rounded-full h-[4px] 
          bg-neutral-400/50 dark:bg-neutral-800
          transition-all group-hover:h-[6px]
        "
      >
        {/* RANGE: Phần đã chạy (Màu xanh) */}
        <RadixSlider.Range 
          className="
            absolute rounded-full h-full 
            bg-emerald-500 group-hover:bg-emerald-400
            transition-colors
          " 
        />
      </RadixSlider.Track>
      
      {/* THUMB: Cục tròn để kéo */}
      <RadixSlider.Thumb 
        className="
          block w-3 h-3 
          bg-white 
          rounded-full 
          shadow-[0_2px_5px_rgba(0,0,0,0.5)] 
          
          /* Hover vào thanh slider thì cục này to ra */
          transition-transform duration-200
          group-hover:scale-125
          
          focus:outline-none focus:ring-0
          cursor-grab active:cursor-grabbing
        " 
        aria-label="Volume Thumb"
      />
    </RadixSlider.Root>
  );
};

export default Slider;