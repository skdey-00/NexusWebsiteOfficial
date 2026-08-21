-- Populate Supabase with CORRECT Team Members
-- Run this in your Supabase SQL Editor

-- Clear existing members first
DELETE FROM members;

-- ===== MECHANICAL DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Aryan Nair', 'Mechanical', '7395', 'head', '4', '/Images/Team Members Photos/Aryan Nair.png', true),
('Rutambhar Gada', 'Mechanical', '1234', 'member', '3', '/Images/Team Members Photos/Rutambhar Gada.png', true),
('Shubham Mehta', 'Mechanical', '2345', 'member', '3', '/Images/Team Members Photos/Shubham Mehta.png', true),
('Paarth Mehta', 'Mechanical', '3456', 'member', '3', '/Images/Team Members Photos/Paarth Mehta.png', true),
('Arpita Bhalekar', 'Mechanical', '4567', 'member', '3', '/Images/Team Members Photos/Arpita Bhalekar.png', true),
('Anurag Rai', 'Mechanical', '5678', 'member', '2', '/Images/Team Members Photos/Anurag Rai.png', true),
('Atharv Chavan', 'Mechanical', '6789', 'member', '2', '/Images/Team Members Photos/Atharv Chavan.png', true),
('Ansh Dsouza', 'Mechanical', '7890', 'member', '2', '/Images/Team Members Photos/Ansh Dsouza.png', true),
('Atharva Singh', 'Mechanical', '8901', 'member', '2', '/Images/Team Members Photos/Atharva Singh.png', true),
('Dhairya Doshi', 'Mechanical', '9012', 'member', '2', '/Images/Team Members Photos/Dhairya Doshi.png', true),
('Samruddhi Bhilare', 'Mechanical', '0123', 'member', '2', '/Images/Team Members Photos/Samruddhi Bhilare.png', true),
('Sanmeet Dey', 'Mechanical', '1111', 'member', '2', '/Images/Team Members Photos/Sanmeet Dey.png', true),
('Sneha Bhat', 'Mechanical', '2222', 'member', '2', '/Images/Team Members Photos/Sneha Bhat.png', true),
('Soham Jadhav', 'Mechanical', '3333', 'member', '2', '/Images/Team Members Photos/Soham Jadhav.png', true),
('Swaraj Gite', 'Mechanical', '4444', 'member', '2', '/Images/Team Members Photos/Swaraj Gite.png', true),
('Avika Bhagwat', 'Mechanical', '5555', 'member', '2', '/Images/Team Members Photos/Avika Bhagwat.png', true);

-- ===== ELECTRONICS DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Aditya Anchan', 'Electronics', '6666', 'head', '4', '/Images/Team Members Photos/Aditya Anchan.png', true),
('Rishabh Jain', 'Electronics', '7777', 'member', '3', '/Images/Team Members Photos/Rishabh Jain.png', true),
('Tanisha Shah', 'Electronics', '8888', 'member', '3', '/Images/Team Members Photos/Tanisha Shah.png', true),
('Ishwar Vijayakumar', 'Electronics', '9999', 'member', '2', '/Images/Team Members Photos/Ishwar Vijayakumar.png', true),
('Nidhi Bhatkar', 'Electronics', '1010', 'member', '2', '/Images/Team Members Photos/Nidhi Bhatkar.png', true),
('Prit Khanolkar', 'Electronics', '1111', 'member', '2', '/Images/Team Members Photos/Prit Khanolkar.png', true);

-- ===== EMBEDDED CODING (PROGRAMMING) DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Mayank Verma', 'Embedded Coding', '4821', 'captain', '4', '/Images/Team Members Photos/Mayank Verma.png', true),
('Daksh Mishra', 'Embedded Coding', '5612', 'member', '3', '/Images/Team Members Photos/Daksh Mishra.png', true),
('Hrishikesh Samant', 'Embedded Coding', '1212', 'member', '3', '/Images/Team Members Photos/Hrishikesh Samant.png', true),
('Himanshu Chavan', 'Embedded Coding', '1313', 'member', '2', '/Images/Team Members Photos/Himanshu Chavan.png', true),
('Sonam Sinha', 'Embedded Coding', '1414', 'member', '2', '/Images/Team Members Photos/Sonam Sinha.png', true);

-- ===== IMAGE PROCESSING & MATLAB DEPARTMENT =====
INSERT INTO members (name, department, pin, role, year, photo_url, is_active) VALUES
('Yash Thakkar', 'Image Processing & Matlab', '1515', 'head', '4', '/Images/Team Members Photos/Yash Thakkar.png', true),
('Harsh Sharma', 'Image Processing & Matlab', '1616', 'head', '4', '/Images/Team Members Photos/Harsh Sharma.png', true),
('Tashi Shrivastava', 'Image Processing & Matlab', '8821', 'member', '3', '/Images/Team Members Photos/Tashi Shrivastava.png', true),
('Rohini Vemula', 'Image Processing & Matlab', '1717', 'member', '2', '/Images/Team Members Photos/Rohini Vemula.png', true),
('Avani Mantri', 'Image Processing & Matlab', '1818', 'member', '2', '/Images/Team Members Photos/Avani Mantri.png', true),
('Kanishk Thacker', 'Image Processing & Matlab', '1919', 'member', '2', '/Images/Team Members Photos/Kanishk Thacker.png', true),
('Siddharth Ganguly', 'Image Processing & Matlab', '2020', 'member', '2', '/Images/Team Members Photos/Siddharth Ganguly.png', true),
('Neeshna Patel', 'Image Processing & Matlab', '2121', 'member', '2', '/Images/Team Members Photos/Neeshna Patel.png', true),
('Tirth Vora', 'Image Processing & Matlab', '2222', 'member', '2', '/Images/Team Members Photos/Tirth Vora.png', true),
('Omkar Ghosh', 'Image Processing & Matlab', '2323', 'member', '2', '/Images/Team Members Photos/Omkar Ghosh.png', true),
('Bhumesh Dadhwal', 'Image Processing & Matlab', '2424', 'member', '2', '/Images/Team Members Photos/Bhumesh Dhadwal.png', true),
('Mohammad Haris Khan', 'Robotics & AI', '2525', 'member', '2', '/Images/Team Members Photos/Mohammad Haris Khan.png', true);

-- Verify the insert
SELECT department, COUNT(*) as member_count
FROM members
WHERE is_active = true
GROUP BY department
ORDER BY department;
