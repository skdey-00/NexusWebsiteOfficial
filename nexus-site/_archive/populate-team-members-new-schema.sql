-- ===== Populate Team Members - New Schema =====
-- Run this in your Supabase SQL Editor
-- This works with the new junction table structure

-- First, ensure departments exist
INSERT INTO departments (id, name, short_name) VALUES
('mechanical', 'Mechanical', 'MECH'),
('electronics', 'Electronics', 'ELEC'),
('embedded', 'Embedded Coding', 'EMBEDDED'),
('ip-matlab', 'Image Processing & Matlab', 'IP'),
('management', 'Creative & Management', 'MGMT')
ON CONFLICT (id) DO NOTHING;

-- Ensure roles exist
INSERT INTO roles (id, name, display_name, priority) VALUES
('captain', 'captain', 'Captain', 100),
('cto', 'cto', 'CTO', 95),
('vice_captain', 'vice_captain', 'Vice Captain', 85),
('head', 'head', 'Department Head', 70),
('member', 'member', 'Member', 0)
ON CONFLICT (id) DO NOTHING;

-- Clear existing data (careful!)
DELETE FROM member_roles;
DELETE FROM member_departments;
DELETE FROM members;

-- Insert members with their departments and roles
-- Format: member_id will be generated automatically

-- ===== MECHANICAL DEPARTMENT =====
INSERT INTO members (name, pin, year, photo_url, is_active) VALUES
('Aryan Nair', '7395', '4', '/Images/Team Members Photos/Aryan Nair.png', true),
('Rutambhar Gada', '1234', '3', '/Images/Team Members Photos/Rutambhar Gada.png', true),
('Shubham Mehta', '2345', '3', '/Images/Team Members Photos/Shubham Mehta.png', true),
('Paarth Mehta', '3456', '3', '/Images/Team Members Photos/Paarth Mehta.png', true),
('Arpita Bhalekar', '4567', '3', '/Images/Team Members Photos/Arpita Bhalekar.png', true),
('Anurag Rai', '5678', '2', '/Images/Team Members Photos/Anurag Rai.png', true),
('Atharv Chavan', '6789', '2', '/Images/Team Members Photos/Atharv Chavan.png', true),
('Ansh Dsouza', '7890', '2', '/Images/Team Members Photos/Ansh Dsouza.png', true),
('Atharva Singh', '8901', '2', '/Images/Team Members Photos/Atharva Singh.png', true),
('Dhairya Doshi', '9012', '2', '/Images/Team Members Photos/Dhairya Doshi.png', true),
('Samruddhi Bhilare', '0123', '2', '/Images/Team Members Photos/Samruddhi Bhilare.png', true),
('Sanmeet Dey', '1111', '2', '/Images/Team Members Photos/Sanmeet Dey.png', true),
('Sneha Bhat', '2222', '2', '/Images/Team Members Photos/Sneha Bhat.png', true),
('Soham Jadhav', '3333', '2', '/Images/Team Members Photos/Soham Jadhav.png', true),
('Swaraj Gite', '4444', '2', '/Images/Team Members Photos/Swaraj Gite.png', true),
('Avika Bhagwat', '5555', '2', '/Images/Team Members Photos/Avika Bhagwat.png', true);

-- ===== ELECTRONICS DEPARTMENT =====
INSERT INTO members (name, pin, year, photo_url, is_active) VALUES
('Aditya Anchan', '6666', '4', '/Images/Team Members Photos/Aditya Anchan.png', true),
('Rishabh Jain', '7777', '3', '/Images/Team Members Photos/Rishabh Jain.png', true),
('Tanisha Shah', '8888', '3', '/Images/Team Members Photos/Tanisha Shah.png', true),
('Ishwar Vijayakumar', '9999', '2', '/Images/Team Members Photos/Ishwar Vijayakumar.png', true),
('Nidhi Bhatkar', '1010', '2', '/Images/Team Members Photos/Nidhi Bhatkar.png', true),
('Prit Khanolkar', '1101', '2', '/Images/Team Members Photos/Prit Khanolkar.png', true);

-- ===== EMBEDDED CODING (PROGRAMMING) DEPARTMENT =====
INSERT INTO members (name, pin, year, photo_url, is_active) VALUES
('Mayank Verma', '4821', '4', '/Images/Team Members Photos/Mayank Verma.png', true),
('Daksh Mishra', '5612', '3', '/Images/Team Members Photos/Daksh Mishra.png', true),
('Hrishikesh Samant', '1212', '3', '/Images/Team Members Photos/Hrishikesh Samant.png', true),
('Himanshu Chavan', '1313', '2', '/Images/Team Members Photos/Himanshu Chavan.png', true),
('Sonam Sinha', '1414', '2', '/Images/Team Members Photos/Sonam Sinha.png', true);

-- ===== IMAGE PROCESSING & MATLAB DEPARTMENT =====
INSERT INTO members (name, pin, year, photo_url, is_active) VALUES
('Yash Thakkar', '1515', '4', '/Images/Team Members Photos/Yash Thakkar.png', true),
('Harsh Sharma', '1616', '4', '/Images/Team Members Photos/Harsh Sharma.png', true),
('Tashi Shrivastava', '8821', '3', '/Images/Team Members Photos/Tashi Shrivastava.png', true),
('Rohini Vemula', '1717', '2', '/Images/Team Members Photos/Rohini Vemula.png', true),
('Avani Mantri', '1818', '2', '/Images/Team Members Photos/Avani Mantri.png', true),
('Kanishk Thacker', '1919', '2', '/Images/Team Members Photos/Kanishk Thacker.png', true),
('Avika Bhagwat', '2020', '2', '/Images/Team Members Photos/Avika Bhagwat.png', true);

-- ===== CREATIVE & MANAGEMENT DEPARTMENT =====
INSERT INTO members (name, pin, year, photo_url, is_active) VALUES
('S. K. Ukrande', '2121', '4', '/Images/Team Members Photos/S. K. Ukarande.png', true),
('Dr. S. K. Ukarande', '2222', '4', '/Images/Team Members Photos/Dr. S. K. Ukarande.png', true);

-- ===== ASSOCIATE MEMBERS WITH DEPARTMENTS =====
-- Mechanical members
INSERT INTO member_departments (member_id, department_id)
SELECT id, 'mechanical' FROM members WHERE name IN (
  'Aryan Nair', 'Rutambhar Gada', 'Shubham Mehta', 'Paarth Mehta',
  'Arpita Bhalekar', 'Anurag Rai', 'Atharv Chavan', 'Ansh Dsouza',
  'Atharva Singh', 'Dhairya Doshi', 'Samruddhi Bhilare', 'Sanmeet Dey',
  'Sneha Bhat', 'Soham Jadhav', 'Swaraj Gite', 'Avika Bhagwat'
);

-- Electronics members
INSERT INTO member_departments (member_id, department_id)
SELECT id, 'electronics' FROM members WHERE name IN (
  'Aditya Anchan', 'Rishabh Jain', 'Tanisha Shah',
  'Ishwar Vijayakumar', 'Nidhi Bhatkar', 'Prit Khanolkar'
);

-- Embedded Coding members
INSERT INTO member_departments (member_id, department_id)
SELECT id, 'embedded' FROM members WHERE name IN (
  'Mayank Verma', 'Daksh Mishra', 'Hrishikesh Samant',
  'Himanshu Chavan', 'Sonam Sinha'
);

-- IP & Matlab members
INSERT INTO member_departments (member_id, department_id)
SELECT id, 'ip-matlab' FROM members WHERE name IN (
  'Yash Thakkar', 'Harsh Sharma', 'Tashi Shrivastava',
  'Rohini Vemula', 'Avani Mantri', 'Kanishk Thacker', 'Avika Bhagwat'
);

-- Management members
INSERT INTO member_departments (member_id, department_id)
SELECT id, 'management' FROM members WHERE name IN (
  'S. K. Ukrande', 'Dr. S. K. Ukarande', 'Tanisha Shah'
);

-- ===== ASSOCIATE MEMBERS WITH ROLES =====
-- Captain
INSERT INTO member_roles (member_id, role_id)
SELECT id, 'captain' FROM members WHERE name = 'Mayank Verma';

-- Department Heads
INSERT INTO member_roles (member_id, role_id)
SELECT id, 'head' FROM members WHERE name IN (
  'Aryan Nair', 'Aditya Anchan', 'Yash Thakkar', 'Harsh Sharma',
  'S. K. Ukrande', 'Dr. S. K. Ukarande', 'Tanisha Shah'
);

-- All other members get 'member' role
INSERT INTO member_roles (member_id, role_id)
SELECT id, 'member' FROM members
WHERE id NOT IN (SELECT member_id FROM member_roles);

-- ===== VERIFY DATA =====
-- Check member count
SELECT 'Total Members:' as label, COUNT(*) as count FROM members
UNION ALL
SELECT 'With Departments:', COUNT(DISTINCT member_id) FROM member_departments
UNION ALL
SELECT 'With Roles:', COUNT(DISTINCT member_id) FROM member_roles;