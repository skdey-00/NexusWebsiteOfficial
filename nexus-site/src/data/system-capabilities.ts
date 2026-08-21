/**
 * SYSTEM CAPABILITIES DATA — Engineering systems specifications
 *
 * Migrated from department HTML pages to centralized data structure.
 * Contains descriptions, capabilities, tools, and team associations for each system.
 */

import type { DeptKey } from './team-data';
import { TEAMS } from './team-data';

export interface SystemCapability {
  name: string;
  description: string;
  coreFunctions: string[];
  tools: string[];
  // Members populated dynamically from team data
  getMembers: () => Array<{
    name: string;
    role: string;
    photoBase?: string;
    objectPosition?: string;
  }>;
}

/**
 * Mechanical Systems — migrated from mechanical.html
 */
const mechanicalCapability: SystemCapability = {
  name: 'MECHANICAL SYSTEMS',
  description: 'From concept to competition-ready hardware, the Mechanical Systems division designs, prototypes and manufactures the physical architecture behind every Nexus robot. We transform innovative concepts into precision-engineered machines using advanced CAD software and state-of-the-art fabrication techniques.',
  coreFunctions: [
    'Design & Modeling',
    'Structural Engineering',
    'Fabrication',
    'Assembly',
    'Testing & Iteration'
  ],
  tools: ['SolidWorks', 'Fusion 360', 'AutoCAD', 'CATIA', 'ANSYS', '3D Printing (FDM/SLA)', 'CNC Machining', 'Laser Cutting', 'Welding & Fabrication'],
  getMembers: () => {
    const members = [];
    for (const yearData of Object.values(TEAMS)) {
      for (const member of yearData.members) {
        if (member.departments.includes('mech')) {
          members.push({
            name: member.name,
            role: member.roles.join(' · '),
            photoBase: member.photoBase,
            objectPosition: member.objectPosition
          });
        }
      }
    }
    return members;
  }
};

/**
 * Electronics Systems — migrated from electronics.html
 */
const electronicsCapability: SystemCapability = {
  name: 'ELECTRONICS SYSTEMS',
  description: 'Circuit design, PCB development, and power management systems that bring the robot to life. Our Electronics team engineers custom PCBs, manages power distribution, integrates diverse sensors, and ensures reliable communication between all robot subsystems.',
  coreFunctions: [
    'PCB Design',
    'Circuit Simulation',
    'Power Systems',
    'Sensors & Actuators',
    'Wiring Harnesses'
  ],
  tools: ['Altium Designer', 'KiCad', 'Eagle PCB', 'LTspice', 'ARM Cortex', 'ESP32', 'STM32', 'Arduino', 'I2C, SPI, UART', 'CAN Bus', 'Bluetooth/WiFi', 'LoRa'],
  getMembers: () => {
    const members = [];
    for (const yearData of Object.values(TEAMS)) {
      for (const member of yearData.members) {
        if (member.departments.includes('elec')) {
          members.push({
            name: member.name,
            role: member.roles.join(' · '),
            photoBase: member.photoBase,
            objectPosition: member.objectPosition
          });
        }
      }
    }
    return members;
  }
};

/**
 * Embedded Systems — migrated from programming.html
 */
const embeddedCapability: SystemCapability = {
  name: 'EMBEDDED SYSTEMS',
  description: 'Firmware development and microcontroller programming that control robot behavior and autonomy. We develop sophisticated algorithms for autonomous navigation, implement computer vision systems, and create precise control systems for optimal robot performance.',
  coreFunctions: [
    'Firmware Development',
    'Sensor Integration',
    'Motor Control',
    'Communication Protocols',
    'Real-Time Processing'
  ],
  tools: ['Python', 'C++', 'JavaScript/Node.js', 'MATLAB', 'OpenCV', 'TensorFlow/PyTorch', 'ROS/ROS2', 'NumPy/SciPy', 'Deep Learning', 'SLAM', 'Kalman Filters', 'Path Planning (A*, RRT)'],
  getMembers: () => {
    const members = [];
    for (const yearData of Object.values(TEAMS)) {
      for (const member of yearData.members) {
        if (member.departments.includes('embed')) {
          members.push({
            name: member.name,
            role: member.roles.join(' · '),
            photoBase: member.photoBase,
            objectPosition: member.objectPosition
          });
        }
      }
    }
    return members;
  }
};

/**
 * Image Processing / MATLAB — migrated from image-processing.html
 */
const imageProcessingCapability: SystemCapability = {
  name: 'IMAGE PROCESSING / MATLAB',
  description: 'Computer vision, image analysis, and algorithm development for robot perception and decision-making. Our team implements advanced object detection, visual navigation systems, and real-time video processing using cutting-edge computer vision libraries and deep learning models.',
  coreFunctions: [
    'Image Processing',
    'Object Detection',
    'Path Planning',
    'Algorithm Development',
    'Sensor Fusion'
  ],
  tools: ['MATLAB', 'Python', 'Simulink', 'C++ for Vision', 'OpenCV', 'TensorFlow/PyTorch', 'YOLO, SSD, Faster R-CNN', 'Image Processing Toolbox', 'Image Segmentation', 'Edge Detection & Contours', 'Feature Extraction', 'Deep Learning Models'],
  getMembers: () => {
    const members = [];
    for (const yearData of Object.values(TEAMS)) {
      for (const member of yearData.members) {
        if (member.departments.includes('ip')) {
          members.push({
            name: member.name,
            role: member.roles.join(' · '),
            photoBase: member.photoBase,
            objectPosition: member.objectPosition
          });
        }
      }
    }
    return members;
  }
};

/**
 * PR & Marketing — migrated from management.html
 */
const prmCapability: SystemCapability = {
  name: 'PR & MARKETING',
  description: 'Brand presence, sponsorship relations, and outreach that connect Nexus with the community and industry partners. Our team drives success through sponsorship acquisition, event coordination, creative design, and strategic team management.',
  coreFunctions: [
    'Brand Management',
    'Sponsor Relations',
    'Event Coordination',
    'Social Media',
    'Publicity'
  ],
  tools: ['Adobe Creative Suite', 'Social Media Platforms', 'Content Management', 'Analytics Tools', 'Budget Planning', 'Expense Tracking', 'Sponsorship Proposals', 'Financial Reporting', 'Timeline Planning', 'Resource Allocation'],
  getMembers: () => {
    const members = [];
    for (const yearData of Object.values(TEAMS)) {
      for (const member of yearData.members) {
        if (member.departments.includes('prm')) {
          members.push({
            name: member.name,
            role: member.roles.join(' · '),
            photoBase: member.photoBase,
            objectPosition: member.objectPosition
          });
        }
      }
    }
    return members;
  }
};

export const SYSTEM_CAPABILITIES: Record<DeptKey, SystemCapability> = {
  mech: mechanicalCapability,
  elec: electronicsCapability,
  embed: embeddedCapability,
  ip: imageProcessingCapability,
  prm: prmCapability,
  mentor: {
    name: 'GUIDANCE',
    description: 'Faculty advisors and industry mentors who provide strategic direction and technical guidance to the team.',
    coreFunctions: ['Technical Guidance', 'Strategic Direction', 'Industry Connections', 'Project Oversight'],
    tools: ['Technical Consultation', 'Project Management', 'Industry Standards'],
    getMembers: () => {
      const members = [];
      for (const yearData of Object.values(TEAMS)) {
        for (const member of yearData.members) {
          if (member.departments.includes('mentor')) {
            members.push({
              name: member.name,
              role: member.roles.join(' · '),
              photoBase: member.photoBase,
              objectPosition: member.objectPosition
            });
          }
        }
      }
      return members;
    }
  }
};

export default SYSTEM_CAPABILITIES;