/**
 * TOOLCHAIN DATA — Software ecosystem and fabrication tools
 *
 * Organized by functional categories for the TOOLCHAIN section.
 * Tools are associated with capabilities from system sections.
 */

export const TOOLCHAIN_CATEGORIES = {
  DESIGN: ['SolidWorks', 'Fusion 360', 'AutoCAD', 'CATIA', 'ANSYS'],
  FABRICATION: ['CNC Machining', '3D Printing (FDM/SLA)', 'Laser Cutting', 'Manual Machining', 'Welding'],
  ELECTRONICS: ['KiCad', 'Altium Designer', 'LTspice', 'Oscilloscopes', 'Soldering Stations'],
  COMPUTATION: ['MATLAB', 'Python', 'OpenCV', 'ROS', 'TensorFlow/PyTorch'],
  EMBEDDED: ['Arduino', 'STM32', 'ESP32', 'PlatformIO', 'JTAG Debuggers'],
  MEDIA_OPERATIONS: ['Adobe Creative Suite', 'Content Management', 'Analytics Tools', 'Social Media Platforms']
};

export interface ToolchainCategory {
  name: string;
  tools: string[];
}

export const TOOLCHAIN_CATEGORIES_ARRAY: ToolchainCategory[] = [
  { name: 'DESIGN', tools: TOOLCHAIN_CATEGORIES.DESIGN },
  { name: 'FABRICATION', tools: TOOLCHAIN_CATEGORIES.FABRICATION },
  { name: 'ELECTRONICS', tools: TOOLCHAIN_CATEGORIES.ELECTRONICS },
  { name: 'COMPUTATION', tools: TOOLCHAIN_CATEGORIES.COMPUTATION },
  { name: 'EMBEDDED', tools: TOOLCHAIN_CATEGORIES.EMBEDDED },
  { name: 'MEDIA_OPERATIONS', tools: TOOLCHAIN_CATEGORIES.MEDIA_OPERATIONS }
];

export default TOOLCHAIN_CATEGORIES;