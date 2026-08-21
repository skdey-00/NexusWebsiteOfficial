-- Populate Supabase with Team Members
-- Run this in your Supabase SQL Editor

-- Clear existing members first (optional - comment out if you want to keep existing data)
-- DELETE FROM members;

-- Insert all team members with their photos and roles

-- ===== MECHANICAL DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Aryan Nair', 'Mechanical', '7395', 'head', '4', '/Images/Team Members Photos/Aryan Nair.png', true),
('Rutambhar Gada', 'Mechanical', '1234', 'member', '3', '/Images/Team Members Photos/Rutambhar Gada.png', true),
('Shubham Mehta', 'Mechanical', '2345', 'member', '3', '/Images/Team Members Photos/Shubham Mehta.png', true),
('Paarth Mehta', 'Mechanical', '3456', 'member', '3', '/Images/Team Members Photos/Paarth Mehta.png', true),
('Arpita Bhalekar', 'Mechanical', '4567', 'member', '2', '/Images/Team Members Photos/Arpita Bhalekar.png', true),
('Anurag Rai', 'Mechanical', '5678', 'member', '2', '/Images/Team Members Photos/Anurag Rai.png', true),
('Atharv Chavan', 'Mechanical', '6789', 'member', '2', '/Images/Team Members Photos/Atharv Chavan.png', true),
('Ansh Dsouza', 'Mechanical', '7890', 'member', '2', '/Images/Team Members Photos/Ansh Dsouza.png', true),
('Atharva Singh', 'Mechanical', '8901', 'member', '2', '/Images/Team Members Photos/Atharva Singh.png', true),
('Avika Bhagwat', 'Mechanical', '9012', 'member', '2', '/Images/Team Members Photos/Avika Bhagwat.png', true),
('Dhairya Doshi', 'Mechanical', '0123', 'member', '2', '/Images/Team Members Photos/Dhairya Doshi.png', true),
('Samruddhi Bhilare', 'Mechanical', '1234', 'member', '2', '/Images/Team Members Photos/Samruddhi Bhilare.png', true),
('Sanmeet Dey', 'Mechanical', '2345', 'member', '2', '/Images/Team Members Photos/Sanmeet Dey.png', true),
('Sneha Bhat', 'Mechanical', '3456', 'member', '2', '/Images/Team Members Photos/Sneha Bhat.png', true),
('Soham Jadhav', 'Mechanical', '4567', 'member', '2', '/Images/Team Members Photos/Soham Jadhav.png', true),
('Swaraj Gite', 'Mechanical', '5678', 'member', '2', '/Images/Team Members Photos/Swaraj Gite.png', true)
;

-- ===== ELECTRONICS DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Aditya Anchan', 'Electronics', '1111', 'head', '4', '/Images/Team Members Photos/Aditya Anchan.png', true),
('Rishabh Jain', 'Electronics', '2222', 'member', '3', '/Images/Team Members Photos/Rishabh Jain.png', true),
('Tanisha Shah', 'Electronics', '3333', 'head', '3', '/Images/Team Members Photos/Tanisha Shah.png', true),
('Ishwar Vijayakumar', 'Electronics', '4444', 'member', '2', '/Images/Team Members Photos/Ishwar Vijayakumar.png', true),
('Nidhi Bhatkar', 'Electronics', '5555', 'member', '3', '/Images/Team Members Photos/Nidhi Bhatkar.png', true),
('Prit Khanolkar', 'Electronics', '6666', 'member', '2', '/Images/Team Members Photos/Prit Khanolkar.png', true)
;

-- ===== EMBEDDED CODING (PROGRAMMING) DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Mayank Verma', 'Embedded Coding', '4821', 'captain', '4', '/Images/Team Members Photos/Mayank Verma.png', true),
('Daksh Mishra', 'Embedded Coding', '5612', 'member', '3', '/Images/Team Members Photos/Daksh Mishra.png', true),
('Hrishikesh Samant', 'Embedded Coding', '6789', 'member', '3', '/Images/Team Members Photos/Hrishikesh Samant.png', true),
('Himanshu Chavan', 'Embedded Coding', '7890', 'member', '2', '/Images/Team Members Photos/Himanshu Chavan.png', true),
('Sonam Sinha', 'Embedded Coding', '8901', 'member', '2', '/Images/Team Members Photos/Sonam Sinha.png', true)
;

-- ===== IMAGE PROCESSING & MATLAB DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Harsh Sharma', 'Image Processing & Matlab', '9999', 'head', '4', '/Images/Team Members Photos/Harsh Sharma.png', true),
('Yash Thakkar', 'Image Processing & Matlab', '8888', 'head', '4', '/Images/Team Members Photos/Yash Thakkar.png', true),
('Tashi Shrivastava', 'Image Processing & Matlab', '8821', 'member', '3', '/Images/Team Members Photos/Tashi Shrivastava.png', true),
('Rohini Vemula', 'Image Processing & Matlab', '7777', 'member', '2', '/Images/Team Members Photos/Rohini Vemula.png', true),
('Avika Bhagwat', 'Image Processing & Matlab', '9012', 'member', '2', '/Images/Team Members Photos/Avika Bhagwat.png', true)
;

-- ===== CREATIVE & MANAGEMENT DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Tanisha Shah', 'Creative & Management', '3333', 'head', '3', '/Images/Team Members Photos/Tanisha Shah.png', true),
('Nidhi Bhatkar', 'Creative & Management', '5555', 'member', '3', '/Images/Team Members Photos/Nidhi Bhatkar.png', true)
;

-- ===== JUNIOR MEMBERS (ADD ADDITIONAL IF NEEDED) =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Tushar Pawar', 'Mechanical', '1111', 'member', '2', '/Images/Team Members Photos/Tushar Pawar.png', true),
('Kanishk Thacker', 'Image Processing & Matlab', '2222', 'member', '2', '/Images/Team Members Photos/Kanishk Thacker.png', true),
('Siddharth Ganguly', 'Image Processing & Matlab', '3333', 'member', '2', '/Images/Team Members Photos/Siddharth Ganguly.png', true),
('Neeshna Patel', 'Image Processing & Matlab', '4444', 'member', '2', '/Images/Team Members Photos/Neeshna Patel.png', true),
('Tirth Vora', 'Image Processing & Matlab', '5555', 'member', '2', '/Images/Team Members Photos/Tirth Vora.png', true),
('Omkar Ghosh', 'Image Processing & Matlab', '6666', 'member', '2', '/Images/Team Members Photos/Omkar Ghosh.png', true),
('Bhumesh Dadhwal', 'Mechanical', '7777', 'member', '2', '/Images/Team Members Photos/Bhumesh Dhadwal.png', true),
('Mohammad Haris Khan', 'Image Processing & Matlab', '8888', 'member', '2', '/Images/Team Members Photos/Mohammad Haris Khan.png', true)
;

-- Verify the insert
SELECT department, COUNT(*) as member_count
FROM members
WHERE is_active = true
GROUP BY department
ORDER BY department;
