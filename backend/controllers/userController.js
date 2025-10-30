const pool = require('../config/database');

// GET USER PROFILE - UPDATE BAGIAN INI
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        u.user_id, 
        u.name, 
        u.email, 
        u.role, 
        u.angkatan, 
        u.fakultas,
        u.created_at,  -- ✅ TAMBAHKAN INI
        -- Alumni fields
        ap.bio as alumni_bio,
        ap.skills as alumni_skills,
        ap.current_job,
        ap.company,
        ap.industry,
        ap.location,
        ap.years_of_experience,
        ap.linkedin_url as alumni_linkedin_url,
        ap.cv_link as alumni_cv_link,
        ap.portfolio_link as alumni_portfolio_link,
        -- Student fields
        sp.nim,
        sp.current_semester,
        sp.ipk,
        sp.interest_fields as student_interests,
        sp.bio as student_bio,
        sp.linkedin_url as student_linkedin_url,
        sp.cv_link as student_cv_link,
        sp.portfolio_link as student_portfolio_link,
        -- Admin fields
        adp.department as admin_department,
        adp.permissions as admin_permissions
      FROM users u
      LEFT JOIN alumni_profiles ap ON u.user_id = ap.user_id
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
      LEFT JOIN admin_profiles adp ON u.user_id = adp.user_id
      WHERE u.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = result.rows[0];
    
    let profile = {
      id: userData.user_id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      angkatan: userData.angkatan,
      fakultas: userData.fakultas,
      createdAt: userData.created_at  // ✅ TAMBAHKAN INI
    };

    if (userData.role === 'alumni') {
      profile.bio = userData.alumni_bio;
      profile.skills = userData.alumni_skills;
      profile.current_job = userData.current_job;
      profile.company = userData.company;
      profile.industry = userData.industry;
      profile.location = userData.location;
      profile.years_of_experience = userData.years_of_experience;
      profile.linkedin_url = userData.alumni_linkedin_url;
      profile.cv_link = userData.alumni_cv_link;
      profile.portfolio_link = userData.alumni_portfolio_link;
    } else if (userData.role === 'student') {
      profile.bio = userData.student_bio;
      profile.nim = userData.nim;
      profile.current_semester = userData.current_semester;
      profile.ipk = userData.ipk;
      profile.interests = userData.student_interests;
      profile.linkedin_url = userData.student_linkedin_url;
      profile.cv_link = userData.student_cv_link;
      profile.portfolio_link = userData.student_portfolio_link;
    } else if (userData.role === 'admin') {
      profile.department = userData.admin_department;
      profile.permissions = userData.admin_permissions;
    }

    res.json({
      success: true,
      user: profile
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET ALL USERS - UPDATE BAGIAN INI
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT user_id, name, email, role, angkatan, fakultas, created_at
      FROM users 
      ORDER BY name
      LIMIT 20
    `);

    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        angkatan: user.angkatan,
        fakultas: user.fakultas,
        createdAt: user.created_at  // ✅ TAMBAHKAN INI
      }))
    });

  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// UPDATE USER PROFILE (SUPPORT PARTIAL UPDATE - INCLUDING ADMIN)
const updateUserProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const userId = req.user.userId;
    const updateData = req.body;

    // Update users table (hanya field yang dikirim)
    const userFields = [];
    const userValues = [];
    let userParamCount = 0;

    if (updateData.name !== undefined) {
      userFields.push(`name = $${++userParamCount}`);
      userValues.push(updateData.name);
    }
    if (updateData.angkatan !== undefined) {
      userFields.push(`angkatan = $${++userParamCount}`);
      userValues.push(updateData.angkatan);
    }
    if (updateData.fakultas !== undefined) {
      userFields.push(`fakultas = $${++userParamCount}`);
      userValues.push(updateData.fakultas);
    }

    if (userFields.length > 0) {
      userValues.push(userId);
      await client.query(
        `UPDATE users SET ${userFields.join(', ')} WHERE user_id = $${userParamCount + 1}`,
        userValues
      );
    }

    // Get user role
    const userResult = await client.query(
      'SELECT role FROM users WHERE user_id = $1',
      [userId]
    );
    const role = userResult.rows[0].role;

    // Update profile berdasarkan role (hanya field yang dikirim)
    if (role === 'alumni') {
      const alumniFields = [];
      const alumniValues = [];
      let alumniParamCount = 0;

      if (updateData.bio !== undefined) {
        alumniFields.push(`bio = $${++alumniParamCount}`);
        alumniValues.push(updateData.bio);
      }
      if (updateData.skills !== undefined) {
        alumniFields.push(`skills = $${++alumniParamCount}`);
        alumniValues.push(updateData.skills);
      }
      if (updateData.current_job !== undefined) {
        alumniFields.push(`current_job = $${++alumniParamCount}`);
        alumniValues.push(updateData.current_job);
      }
      if (updateData.company !== undefined) {
        alumniFields.push(`company = $${++alumniParamCount}`);
        alumniValues.push(updateData.company);
      }
      if (updateData.industry !== undefined) {
        alumniFields.push(`industry = $${++alumniParamCount}`);
        alumniValues.push(updateData.industry);
      }
      if (updateData.location !== undefined) {
        alumniFields.push(`location = $${++alumniParamCount}`);
        alumniValues.push(updateData.location);
      }
      if (updateData.years_of_experience !== undefined) {
        alumniFields.push(`years_of_experience = $${++alumniParamCount}`);
        alumniValues.push(updateData.years_of_experience);
      }
      if (updateData.linkedin_url !== undefined) {
        alumniFields.push(`linkedin_url = $${++alumniParamCount}`);
        alumniValues.push(updateData.linkedin_url);
      }
      if (updateData.cv_link !== undefined) {
        alumniFields.push(`cv_link = $${++alumniParamCount}`);
        alumniValues.push(updateData.cv_link);
      }
      if (updateData.portfolio_link !== undefined) {
        alumniFields.push(`portfolio_link = $${++alumniParamCount}`);
        alumniValues.push(updateData.portfolio_link);
      }

      if (alumniFields.length > 0) {
        alumniValues.push(userId);
        await client.query(
          `UPDATE alumni_profiles SET ${alumniFields.join(', ')} WHERE user_id = $${alumniParamCount + 1}`,
          alumniValues
        );
      }
    } else if (role === 'student') {
      const studentFields = [];
      const studentValues = [];
      let studentParamCount = 0;

      if (updateData.bio !== undefined) {
        studentFields.push(`bio = $${++studentParamCount}`);
        studentValues.push(updateData.bio);
      }
      if (updateData.interests !== undefined || updateData.skills !== undefined) {
        studentFields.push(`interest_fields = $${++studentParamCount}`);
        studentValues.push(updateData.interests || updateData.skills);
      }
      if (updateData.nim !== undefined) {
        studentFields.push(`nim = $${++studentParamCount}`);
        studentValues.push(updateData.nim);
      }
      if (updateData.current_semester !== undefined) {
        studentFields.push(`current_semester = $${++studentParamCount}`);
        studentValues.push(updateData.current_semester);
      }
      if (updateData.ipk !== undefined) {
        studentFields.push(`ipk = $${++studentParamCount}`);
        studentValues.push(updateData.ipk);
      }
      if (updateData.linkedin_url !== undefined) {
        studentFields.push(`linkedin_url = $${++studentParamCount}`);
        studentValues.push(updateData.linkedin_url);
      }
      if (updateData.cv_link !== undefined) {
        studentFields.push(`cv_link = $${++studentParamCount}`);
        studentValues.push(updateData.cv_link);
      }
      if (updateData.portfolio_link !== undefined) {
        studentFields.push(`portfolio_link = $${++studentParamCount}`);
        studentValues.push(updateData.portfolio_link);
      }

      if (studentFields.length > 0) {
        studentValues.push(userId);
        await client.query(
          `UPDATE student_profiles SET ${studentFields.join(', ')} WHERE user_id = $${studentParamCount + 1}`,
          studentValues
        );
      }
    } else if (role === 'admin') {
      const adminFields = [];
      const adminValues = [];
      let adminParamCount = 0;

      if (updateData.department !== undefined) {
        adminFields.push(`department = $${++adminParamCount}`);
        adminValues.push(updateData.department);
      }
      if (updateData.permissions !== undefined) {
        adminFields.push(`permissions = $${++adminParamCount}`);
        adminValues.push(updateData.permissions);
      }

      if (adminFields.length > 0) {
        adminValues.push(userId);
        await client.query(
          `UPDATE admin_profiles SET ${adminFields.join(', ')} WHERE user_id = $${adminParamCount + 1}`,
          adminValues
        );
      }
    }

    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// DELETE USER PROFILE (HARD DELETE - CLEAN VERSION)
const deleteUserProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const userId = req.user.userId;

    // Delete dari semua related tables
    await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await client.query('DELETE FROM connections WHERE user1_id = $1 OR user2_id = $1', [userId]);
    await client.query('DELETE FROM event_registrations WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM job_applications WHERE applicant_id = $1', [userId]);
    await client.query('DELETE FROM ai_recommendations WHERE user_id = $1 OR recommended_user_id = $1', [userId]);
    await client.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM group_members WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM alumni_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM student_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM admin_profiles WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE user_id = $1', [userId]);

    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Profile deleted permanently'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete profile error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Delete failed. Please try again.'
    });
  } finally {
    client.release();
  }
};

module.exports = { 
  getUserProfile, 
  getAllUsers, 
  updateUserProfile, 
  deleteUserProfile 
};