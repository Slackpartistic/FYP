const express = require('express')
const app = express()
const mysql=require('mysql')
const cors=require('cors')
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');



app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db=mysql.createConnection({
    user:'root',
    host:'localhost',
    password:"your pass",
    database:'your db'
})

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to database');
});

app.get("/admin_login", (req, res) => {
  db.query("select*from users where Usr_type=1;", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});


app.get('/sessions', (req, res) => {
  const { date } = req.query;
  db.query('SELECT Session FROM file WHERE Date = ?', [date], (error, results) => {
    if (error) throw error;
    const bookedSessions = results.map(result => result.Session);
    const availableSessions = [1, 2, 3, 4].filter(session => !bookedSessions.includes(session));
    res.send(availableSessions);
  });
});
                                                                         
app.post("/add",(req,res)=>{
  const { data} = req.body;
  const userid=req.body.id;
  const session=req.body.session;
  const date=req.body.date;
  const time=req.body.currenttime;
  const file=req.body.fileName;
  const val = data.map(item => [item.Name]);
  const count = val.length;  
  const userIds = [];
  for (let name of val) {
    db.query('SELECT COALESCE((SELECT usr_ID FROM users WHERE Name = ?),null ) as userID', [name], (error, results) => {
      if (error) throw error;
      const userId = results[0].userID;
      userIds.push(userId);
    });      
  }
  db.query(`INSERT INTO file (User_ID, Name, Session, Date, Time, Total_records) VALUES (?, ?, ?, ?, ?, ?)`, [userid, file, session, date, time, count]);

  const qr1 = `SELECT File_ID FROM file ORDER BY File_ID DESC LIMIT 1`;
  db.query(qr1, (err, Result) => {
    if (err) throw err;
    const id = Result[0].File_ID;
  
    const value = data.map((item, index) => [userIds[index], id, date, item.Room]);
    db.query('INSERT INTO paper_collection (User_ID, File_ID, Date, Room) VALUES ?', [value]);
    
    const query = 'SELECT status FROM paper_collection WHERE User_ID IN (?) AND File_ID = ?';
    db.query(query, [userIds, id], (error, results) => {
      if (error) throw error;
      const roomStatusValues = results.map(result => result.status);
      const values = data.map((item, index) => [item.Id, id, userIds[index], item.Name, item.Status, item.Room, item.Latitude, item.Longitude, roomStatusValues[index]]);
      db.query('INSERT INTO file_details (Id, File_ID, User_ID, Name, Status, Room, Latitude, Longitude, Room_Paper_Status) VALUES ?', [values]);
    });
  });
    
});

  app.post("/userid",(req,res)=>{
    const {email} = req.body;
    db.query(`TRUNCATE TABLE id`);
    db.query(`INSERT INTO id (email) VALUES ('${email}')`);
  });
  
  app.get("/getuserid", (req, res) => {
    const sql = `SELECT email FROM id ORDER BY email DESC LIMIT 1`;
    db.query(sql, (err, result) => {
      if (err) throw err;
      const idSql = 'SELECT usr_ID FROM users WHERE Email = ?';
      db.query(idSql, [result[0].email], (err, idResult) => {
        if (err) throw err;
        const id=idResult[0].usr_ID;
        res.status(200).send(id.toString());
      });
    });
  });

  app.get("/view", (req, res) => {
    const fileId = req.query.fileId;
    const status = req.query.status;
    const sql = 'SELECT * FROM file_details WHERE File_ID = ? AND Status = ?';
    db.query(sql, [fileId, status], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });

  app.get("/vview", (req, res) => {
    const fileId = req.query.fileId;
        const sqlUpdate = 'UPDATE file_details JOIN paper_collection ON paper_collection.User_ID = file_details.User_ID SET file_details.Room_Paper_Status = paper_collection.status WHERE file_details.File_ID IN (?) AND paper_collection.File_ID = ?';
        db.query(sqlUpdate, [fileId, fileId], (err, updateResult) => {
          if (err) {
            console.log(err);
          } else {
            const sql = 'SELECT * FROM file_details WHERE File_ID = ?';
            db.query(sql, [fileId], (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.send(result);
              }
            });
          }
        });
      }
  );
  
  
  
  app.get("/rooms", (req, res) => {
    const fileId = req.query.fileId;
    const sql = 'SELECT Room FROM file_details WHERE File_ID = ? AND Status = "A"';
    db.query(sql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });

  app.get("/idss", (req, res) => {
    const name = req.query.name;
    const sql = 'SELECT usr_ID FROM users WHERE Name = ? ';
    db.query(sql, [name], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });

  app.get("/file", (req, res) => {
    db.query(
      "SELECT file.File_ID, file.Name, file.Session, file.Date, file.Time, file.Total_records,file.Last_updated, users.Name as user_name FROM file JOIN users ON file.User_ID = users.usr_ID",
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result);
        }
      }
    );
  });
  
  app.get('/adminname', (req, res) => {
    const id = req.query.id;
    const sql = 'SELECT Name FROM users WHERE usr_ID = ?';
    db.query(sql, [id], (err, result) => {
       if (result.length > 0) {
        const name = result[0].Name;
        res.send(name);
      }
    });
  });
  
  app.get('/invig', (req, res) => {
    const sql = 'SELECT Name FROM users WHERE Usr_type = "2"';
    db.query(sql, (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  });

  app.delete("/delete", (req, res) => {
    const fileId = req.query.fileId;
    const sql = 'DELETE FROM paper_collection WHERE File_ID = ?';
    db.query(sql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error deleting file.");
      } else {
        const sql1 = 'DELETE FROM file_details WHERE File_ID = ?';
        db.query(sql1, [fileId], (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send("Error deleting file.");
          } else {
            const sql2 = 'DELETE FROM file WHERE File_ID = ?';
            db.query(sql2, [fileId], (err, result) => {
              if (err) {
                console.log(err);
                res.status(500).send("Error deleting file.");
              } else {
                res.status(200).send("File deleted successfully.");
              }
            });
          }
        });
      }
    });     
  });
  

  app.post("/delete-and-insert", (req, res) => {
    const { data, currentDateTime } = req.body;
    const fileId = req.query.fileId;
    const deleteSql = 'DELETE FROM file_details WHERE File_ID = ?';
    const values = data.map((item) => [item.Id, item.File_ID, item.User_ID, item.Name, item.Status, item.Room, item.Latitude, item.Longitude]);
    const insertSql = 'INSERT INTO file_details (Id, File_ID, User_ID, Name, Status, Room, Latitude, Longitude) VALUES ?';
  
    db.query(deleteSql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        db.query(insertSql, [values], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            const updateSql = 'UPDATE file SET Last_updated = ? WHERE File_ID = ?';
            db.query(updateSql, [currentDateTime, fileId], (err, result) => {
              if (err) {
                console.log(err);
              } else {
                db.query('SELECT User_ID FROM paper_collection WHERE File_ID = ? AND Status = "Collected"', [fileId], (err, collectedResult) => {
                  if (err) {
                    console.log(err);
                  } else {
                    const collectedUserIds = collectedResult.map((item) => item.User_ID);
                    db.query('SELECT Date FROM paper_collection WHERE File_ID = ?', [fileId], (err, result) => {
                      if (err) {
                        console.log(err);
                      } else {
                        const date = result[0].Date;
                        db.query('DELETE FROM paper_collection WHERE File_ID = ?', [fileId], (err, deleteResult) => {
                          if (err) {
                            console.log(err);
                          } else {
                            const value = data.map((item) => [item.User_ID, item.File_ID, date, item.Room]);
                            db.query('INSERT INTO paper_collection (User_ID, File_ID, Date, Room) VALUES ?', [value], (err, insertResult) => {
                              if (err) {
                                console.log(err);
                              } else {
                                if (collectedUserIds && collectedUserIds.length > 0) {
                                  db.query('UPDATE paper_collection SET Status = "Collected" WHERE File_ID = ? AND User_ID IN (?)', [fileId, collectedUserIds], (err, updateResult) => {
                                    if (err) {
                                      console.log(err);
                                    } else {
                                    }
                                  });
                                }                                  
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
  app.post('/reassign', (req, res) => {
    const { User_ID, newRoom, fileId } = req.body;
    const query = `UPDATE file_details SET Room = '${newRoom}' WHERE User_ID = '${User_ID}' AND File_ID = '${fileId}'`;
    db.query(query, (err, result) => {
      if (err) throw err;
    });
  });

  app.post('/addprofile', (req, res) => {
    const { name, userType, email, phone, password, address, status, dutyStatus } = req.body;
    const query = `INSERT INTO users (Name, Usr_type, Email, Phone, Password, Address, \`Status\`, \`Duty_Status\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [name, userType, email, phone, password, address, status, dutyStatus], (error, results) => {
      if (error) {
        console.error(error);
        
      } else {
        
      }
    });
  });

  app.get('/checkEmailExists', (req, res) => {
    const { email } = req.query;
    const query = `SELECT COUNT(*) AS count FROM users WHERE Email = '${email}'`;
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error checking email existence:', error);
        res.status(500).json({ error: 'An error occurred while checking the email existence.' });
      } else {
        const count = results[0].count;
        const exists = count > 0;
        res.json({ exists });
      }
    });
  });

  app.post('/config', (req, res) => {
    const {session,range,sessionStartTime,sessionEndTime,attendanceStartTime,attendanceEndTime,} = req.body;
    const updateQuery = `UPDATE config
    SET distance_range = ${range},
    session_start_time = '${sessionStartTime}',
    session_end_time = '${sessionEndTime}',
    attendance_start_time = '${attendanceStartTime}',
    attendance_end_time = '${attendanceEndTime}'
    WHERE session = ${session}`;
    db.query(updateQuery, (error, results) => {
      if (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update config' });
      } else {
        res.status(200).json({ message: 'Config updated successfully' });
      }
    });
  });


  app.get('/fetchemailforotp', async (req, res) => {
    const { email } = req.query;
  
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.query(sql, [email], async (error, results) => {
        if (error) {
          console.error('Error during database query:', error);
          res.status(500).json({ success: false, message: 'An error occurred while checking email existence' });
        } else if (results.length === 0) {
          res.status(404).json({ success: false, message: 'Email does not exist' });
        } else {
          const subject = 'OTP Request';
          const otp = generateOTP();
          const htmlContent = `
            <h1>OTP Request</h1>
            <p>Your OTP for password reset request is: ${otp}</p>
          `;
          await sendEmail(email, subject, htmlContent);
  
          res.status(200).json({ success: true, message: 'OTP sent successfully' });
        }
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  });
  
  

  const sendEmail = async (email, subject, htmlContent) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'preferred-service',
        auth: {
          user: 'your email',
          pass: 'your password'
        }
      });
  
      const info = await transporter.sendMail({
        from: 'IDMS APP <te5784811@gmail.com>',
        to: email,
        subject: subject,
        html: htmlContent
      });
  
      console.log('Message sent: ' + info.messageId);
    } catch (error) {
      console.log(error);
    }
  };

  let storeOTP = null;

  const generateOTP = () => {
    const length = 6;
    let OTP = '';
  
    for (let i = 0; i < length; i++) {
      const digit = Math.floor(Math.random() * 10);
      OTP += digit;
    }
  
    storeOTP = OTP;
    return OTP;
  }
  
  module.exports = generateOTP;
  

  app.get('/verifyotp', (req, res) => {
    const { email, enteredOTP } = req.query;
  
    if (!storeOTP) {
      res.status(400).json({ success: false, message: 'OTP not found or expired' });
    } else if (enteredOTP === storeOTP) {
      storeOTP = null;
      res.status(200).json({ success: true, message: 'OTP verification successful' });
      console.log('OTP verified!');
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  });

  app.post('/savepassword', (req, res) => {
    const { email,password, confirmPassword } = req.body;
    if (password==confirmPassword){
    const query = `Update users SET Password = ? WHERE email = ?`;
    db.query(query, [password,email], (error, results) => {
      if (error) {
        console.error(error);
        
      } else {
        
      }
    });
  }
  else{
    console.log('Error in setting password.')
  }
  
    res.status(200).json({ success: true, message: 'Passwords saved successfully' });
  });
  


  function fac_login(email, password) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ? AND Password = ? AND usr_type=2';
      db.query(sql, [email, password], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve({ success: false, message: 'Invalid email or password' });
        } else {
          const user = results[0];
          resolve({ success: true, data: user, email: email });
        }
      });
    });
  }

  module.exports = {
    fac_login,
  };

  app.get('/facultylogin', async (req, res) => {
    const { email, password } = req.query;
    try {
      const result = await fac_login(email, password);
      if (result.success) {
        res.status(200).json({ success: true, data: { email: email, user: result.data } });
      } else {
        res.status(401).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
  });
  
  app.get('/fetchfacultydata', async (req, res) => {
    try {
      const email = req.query.email;
      console.log('Fetching data for email:', email);
      const sql = `
      SELECT users.Name, file_details.Room, file.Session, file.Date, file_details.Status
FROM users
INNER JOIN file_details ON file_details.User_ID = users.usr_ID
INNER JOIN file ON file.File_ID = file_details.File_ID
WHERE users.Email = ?
AND file.Date >= DATE(NOW())
ORDER BY file.Date;
      `;
      db.query(sql, [email], (error, results) => {
        if (error) {
          console.error('Error fetching faculty data:', error);
          res.status(500).json({ success: false, message: 'An error occurred while fetching data' });
        } else {
          res.status(200).json({ success: true, data: results });
        }
      });
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      res.status(500).json({ success: false, message: 'An error occurred while fetching data' });
    }
  });
  

  app.get('/getsession', (req, res) => {
    const email = req.query.email;

    const currentDate = new Date();
    const currentTime = new Date(currentDate.getTime());
    const currentHour = currentTime.getHours().toString().padStart(2, '0');
    const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
    const currentSecond = currentTime.getSeconds().toString().padStart(2, '0');
    const currentTimeFormatted = `${currentHour}:${currentMinute}:${currentSecond}`;
  
    const sqlSession = `SELECT session, distance_range FROM config 
                        WHERE TIME(attendance_start_time) <= ? 
                        AND TIME(attendance_end_time) >= ?`;

    db.query(sqlSession, [currentTimeFormatted, currentTimeFormatted], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error fetching session from database');
        return;
      }
      result = rows;
  
      console.log('SQL Result:', result);
  
      const currentSession = result.length > 0 ? result[0].session : null;
      const range=result.length > 0 ? result[0].distance_range : null;
      console.log('Current session: ' + currentSession);
      console.log('Range: ' + range);

      let userId;
db.query('SELECT usr_ID FROM users WHERE Email = ?', [email], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }

  userId = results[0].usr_ID;

  let attendancestatus;
      db.query('SELECT file_details.status FROM file_details INNER JOIN users ON file_details.User_ID = users.usr_ID INNER JOIN file ON file_details.File_ID=file.File_ID where users.email=? AND file.session=? AND File.date=Date(Now())'
      , [email,currentSession], (err, results) => {
        if (err) {
          console.error(err);
          return;
        }
        attendancestatus = results[0] ? results[0].status : null;
        console.log(attendancestatus);
  let room;
  db.query('SELECT Room FROM file_details WHERE User_ID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    room = results[0].Room;
    let status;
    db.query('SELECT Status FROM paper_collection WHERE Room = ?', [room], (err, results) => {
      if (err) {
        console.error(err);
        return;
      }
      status = results[0] ? results[0].Status : null;
      console.log(status);
      let statusbasedonsession;
      db.query('SELECT paper_collection.status FROM paper_collection INNER JOIN file ON paper_collection.file_ID = file.file_ID INNER JOIN users on users.usr_ID = paper_collection.User_ID WHERE file.session = ? AND file.Date=Date(Now()) AND users.email=?'
      , [currentSession,email], (err, results) => {
        if (err) {
          console.error(err);
          return;
        }
        statusbasedonsession = results[0] ? results[0].status : null;
        console.log(statusbasedonsession);

        

        console.log(`The status for room ${room} is ${statusbasedonsession}`);
  
      const sql = `SELECT file.Session, paper_collection.ID as Paper_ID 
                   FROM file 
                   INNER JOIN paper_collection ON paper_collection.File_ID=file.File_ID 
                   WHERE paper_collection.User_ID = (select usr_id from users where email=?) 
                   AND file.Session = ?
                   ORDER BY file.Session`;
  
      db.query(sql, [email, currentSession], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error fetching session data');
        } else {
          const sessionData = results.map(result => result.Session);
          const currentSession = sessionData.length > 0 ? sessionData[0] : null;
          res.json({'sessionData': sessionData, 'currentSession': currentSession, 'statusbasedonsession': statusbasedonsession,'attendancestatus': attendancestatus,'range': range});
          console.log(sessionData);
          console.log(currentSession);
          console.log(statusbasedonsession);
          console.log(attendancestatus);
          console.log(range);
        }
      });
    });
  });
});
});
});
 });
});
  
  app.get('/getfacultymarkattendance', (req, res) => {
    const email = req.query.email;
  
    const currentDate = new Date();
    const currentTime = new Date(currentDate.getTime());
    const currentHour = currentTime.getHours().toString().padStart(2, '0');
    const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
    const currentSecond = currentTime.getSeconds().toString().padStart(2, '0');
    const currentTimeFormatted = `${currentHour}:${currentMinute}:${currentSecond}`;
    console.log(currentTimeFormatted);
  
    const sqlSession = `SELECT session FROM config 
                        WHERE TIME(attendance_start_time) <= ? 
                        AND TIME(attendance_end_time) >= ?`;
  
    db.query(sqlSession, [currentTimeFormatted, currentTimeFormatted], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error fetching session from database');
        return;
      }
      result = rows;
  
      console.log('SQL Result:', result);
  
      const currentSession = result.length > 0 ? result[0].session : null;
  
  
      const sql = `SELECT file_details.Room, file_details.Status, file.Session, paper_collection.ID
      FROM file_details 
      INNER JOIN file ON file_details.File_ID = file.File_ID 
      INNER JOIN paper_collection ON paper_collection.File_ID = file.File_ID 
      INNER JOIN users ON users.usr_ID = file_details.User_ID
      WHERE file_details.User_ID = (SELECT usr_ID FROM users WHERE email = ?) 
      AND paper_collection.User_ID = file_details.User_ID
      AND DATE(file.Date) = DATE(NOW()) 
      AND file.Session = ?`;
        
      db.query(sql, [email, currentSession], (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send('Error fetching session data');
        } else {
          const sessionData = results.map(result => result.Session);
          const currentSession = sessionData.length > 0 ? sessionData[0] : null;
          res.json({'sessionData': sessionData, 'currentSession': currentSession, 'data': results});
          console.log(sessionData);
          console.log(currentSession);
          console.log(results);
        }
      });
      
    });
  });
  
app.post('/postfacultymarkattendance', (req, res) => {
  console.log('Received postfacultymarkattendance request with body:', req.body);
  const { email, paperCollectionId, status, Latitude, Longitude } = req.body;
  console.log('email:', email);
  console.log('paperCollectionId:', paperCollectionId);
  console.log('status:', status);
  console.log('Latitude:',Latitude);
  console.log('Longitude:', Longitude);
  
  const sql = `UPDATE file_details 
  SET Status = ?, latitude = ?, longitude = ? 
  WHERE User_ID = (
    SELECT usr_ID 
    FROM users 
    WHERE email = ?
  ) AND File_ID IN (
    SELECT File_ID 
    FROM paper_collection 
    WHERE ID = ?
  )`;
  db.query(sql, [status, Latitude, Longitude, email, paperCollectionId], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error updating faculty data');
    } else {
      console.log('Faculty data updated successfully');
      const records = results;
      for (let i = 0; i < records.length; i++) {
        const paperId = records[i].ID;
        const selectedStatus = records[i].Status;
        console.log(`Sending attendance data for email ${email} and paper ID ${paperId}, status: ${selectedStatus}, latitude:${Latitude}, longitude:${Longitude}`);
        sendAttendanceData(email, paperId, selectedStatus, Latitude, Longitude);
      }
      res.send(`Attendance data sent successfully. Updated faculty data for email ${email} and paper collection ID ${paperCollectionId}`);
    }
  });
});

function sendAttendanceData(email, paperId, selectedStatus, Latitude, Longitude) {
  console.log(`Sending attendance data for email ${email} and paper ID ${paperId}, status: ${selectedStatus}, latitude:${Latitude}, longitude:${Longitude}`);
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, paperId: paperId, selectedStatus: selectedStatus,Latitude:Latitude,Longitude:Longitude })
  };
  fetch('http://your-ip:3001/postattendancemarkedbyfaculty', options)
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error(error));
}


app.get('/getpapercollectionrecord', (req, res) => {
  const email = req.query.email;

  const currentDate = new Date();
    const currentTime = new Date(currentDate.getTime());
    const currentHour = currentTime.getHours().toString().padStart(2, '0');
    const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
    const currentSecond = currentTime.getSeconds().toString().padStart(2, '0');
    const currentTimeFormatted = `${currentHour}:${currentMinute}:${currentSecond}`;
    console.log(currentTimeFormatted);

    const sqlSession = `SELECT session FROM config 
                        WHERE TIME(attendance_start_time) <= ? 
                        AND TIME(attendance_end_time) >= ?`;
  
    db.query(sqlSession, [currentTimeFormatted, currentTimeFormatted], (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error fetching session from database');
        return;
      }
      result = rows;
  
      console.log('SQL Result:', result);
  
      const currentSession = result.length > 0 ? result[0].session : null;

      let userId;
db.query('SELECT usr_ID FROM users WHERE Email = ?', [email], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }

  userId = results[0].usr_ID;
  let room;
  db.query('SELECT Room FROM file_details WHERE User_ID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }

    room = results[0].Room;
    let status;
    db.query('SELECT Status FROM paper_collection WHERE Room = ?', [room], (err, results) => {
      if (err) {
        console.error(err);
        return;
      }

      status = results[0].Status;

      console.log(`The status for room ${room} is ${status}`);

  const sql = `SELECT file_details.Room, file.Session, paper_collection.ID, paper_collection.Status
  FROM file_details 
  INNER JOIN file ON file_details.File_ID = file.File_ID 
  INNER JOIN paper_collection ON paper_collection.File_ID = file.File_ID 
  INNER JOIN users ON users.usr_ID = file_details.User_ID
  WHERE file_details.User_ID =  (SELECT usr_ID FROM users WHERE email = ?) 
  AND paper_collection.User_ID = file_details.User_ID
  and paper_collection.room = file_details.room
    AND DATE(File.Date) = DATE(NOW()) 
    AND file.Session = ?`;

  db.query(sql, [email,currentSession], (error, results) => {
      if (error) {
          console.error(error);
          res.status(500).send('Error fetching paper collection record data');
      } else {
        const sessionData = results.map(result => result.Session);
        const currentSession = sessionData.length > 0 ? sessionData[0] : null;
        res.json({'sessionData': sessionData, 'currentSession': currentSession, 'data': results});
        console.log(sessionData);
        console.log(currentSession);
        console.log(results);
      }
  });
});
});
});
});
});

app.post('/postpapercollectionrecord', (req, res) => {
  console.log('Received postpapercollectionrecord request with body:', req.body);
  const { email, paperCollectionId, status } = req.body;
  console.log('email:', email);
  console.log('paperCollectionId:', paperCollectionId);
  console.log('status:', status);

  const currentDate = new Date();
  const currentTime = new Date(currentDate.getTime());
  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
  const currentSecond = currentTime.getSeconds().toString().padStart(2, '0');
  const currentTimeFormatted = `${currentHour}:${currentMinute}:${currentSecond}`;
  console.log(currentTimeFormatted);

  const sqlSession = `SELECT session FROM config 
                      WHERE TIME(attendance_start_time) <= ? 
                      AND TIME(attendance_end_time) >= ?`;

  db.query(sqlSession, [currentTimeFormatted, currentTimeFormatted], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error fetching session from database');
      return;
    }
    result = rows;

    console.log('SQL Result:', result);

    const currentSession = result.length > 0 ? result[0].session : null;

    let userId;
db.query('SELECT usr_ID FROM users WHERE Email = ?', [email], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  userId = results[0].usr_ID;

  let room;
  db.query('SELECT Room FROM file_details WHERE User_ID = ?', [userId], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }

    room = results[0].Room;

  const sql = `UPDATE paper_collection 
                INNER JOIN file on file.file_ID = paper_collection.file_ID
                 INNER JOIN users ON users.usr_ID=paper_collection.User_ID 
                 SET paper_collection.status = ?
                 WHERE paper_collection.room=? AND file.session=? AND file.Date = Date(Now())`;
  db.query(sql, [status, room, currentSession], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error updating paper collection record');
    } else {
      console.log('Paper collection record updated successfully');
      const records = results;
      for (let i = 0; i < records.length; i++) {
        const paperId = records[i].ID;
        const selectedStatus = records[i].Status;
        console.log(`Sending paper collection data for email ${email} and room ${room}, status: ${selectedStatus}`);
        sendPaperCollectionData(email, paperId, selectedStatus);
      }
      res.send(`Paper collection data sent successfully. Updated record for email ${email} and paper collection ID ${paperCollectionId}`);
    }
  });
});
});
});
});

function sendPaperCollectionData(email, paperId, status) {
  console.log(`Sending paper collection data for email ${email} and paper ID ${paperId}, status: ${status}`);
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, paperId: paperId, status: status })
  };
  fetch('http://your-ip:3001/postpapercollectionrecord', options)
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

  

  app.get('/fetchfacultyattendancehistory', (req, res) => {
    const email = req.query.email;
  
    const sql = `SELECT file_details.Name, file_details.Room, file.Session, file_details.Status,file.Date
    FROM file_details 
    INNER JOIN file ON file_details.File_ID=file.File_ID  
    WHERE file_details.User_ID = (SELECT usr_ID FROM users WHERE email = ?) 
    AND file.Date < DATE(NOW())
    ORDER BY File.Date DESC
    `;
  
    db.query(sql, [email], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error fetching faculty data');
      } else {
        res.json(results);
      }
    });
  });
   
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
