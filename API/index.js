const express = require('express')
const app = express()
const mysql=require('mysql')
const cors=require('cors')
const bodyParser = require('body-parser');
const bcrypt=require('bcrypt');
const fetch = require('node-fetch');

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db=mysql.createConnection({
    user:'root',
    host:'localhost',
    password:"yourpass",
    database:'yourdb'
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
  db.query(`insert into file (User_ID,Name,Session,Date,Time,Total_records) values ('${userid}','${file}','${session}','${date}','${time}','${count}')`);
  const qr1=`SELECT File_ID FROM file ORDER BY File_ID DESC LIMIT 1`;
  db.query(qr1,(err, Result) => {
    if (err) throw err;
    const id=Result[0].File_ID;
    const values = data.map((item, index) => [item.Id, id, userIds[index], item.Name, item.Status, item.Room, item.Latitude, item.Longitude]);  
    db.query('insert into file_details (Id,File_ID,User_ID,Name,Status,Room,Latitude,Longitude) values ?',[values]);
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
    const sql = 'SELECT * FROM file_details WHERE File_ID = ?';
    db.query(sql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
  });
  
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
      "SELECT file.File_ID, file.Name, file.Session, file.Date, file.Time, file.Total_records, users.Name as user_name FROM file JOIN users ON file.User_ID = users.usr_ID",
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
    
    // Delete from paper_collection table
    const sql = 'DELETE FROM paper_collection WHERE File_ID = ?';
    db.query(sql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // Delete from file_details table
        const sql1 = 'DELETE FROM file_details WHERE File_ID = ?';
        db.query(sql1, [fileId], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            // Delete from file table
            const sql2 = 'DELETE FROM file WHERE File_ID = ?';
            db.query(sql2, [fileId], (err, result) => {
              if (err) {
                console.log(err);
              } else {
                
              }
            });
          }
        });
      }
    });
  });
  

  app.post("/delete-and-insert", (req, res) => {
    const { data, currentDateTime,nameInput } = req.body; 
    const fileId = req.query.fileId;
    const deleteSql = 'delete FROM file_details WHERE File_ID = ?';
    const values = data.map((item) => [item.Id, item.File_ID, item.User_ID, item.Name, item.Status, item.Room, item.Latitude, item.Longitude]); 
    const insertSql = 'insert into file_details (Id,File_ID,User_ID,Name,Status,Room,Latitude,Longitude) values ?';      
    
    db.query(deleteSql, [fileId], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        db.query(insertSql, [values], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            const updateSql = 'update file_details set Last_updated = ? where File_ID = ?';
            db.query(updateSql, [currentDateTime, fileId], (err, result) => {
              if (err) {
                console.log(err);
              } else {

              }
            });
          }
        });
      }
    });
  });





// const pool = mysql.createPool({
//   host: 'localhost',
//   port: 3306,
//   user: 'root',
//   password: 'Adminissick2543',
//   database: 'fyp_db',
// });

  // app.get("/faculty_login", (req, res) => {
  //   db.query("select*from users where Usr_type=2;", (err, result) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.send(result.toString);
  //     }
  //   });
  // });

  function fac_login(email, password) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ? AND Password = ?';
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
        // Pass email value along with the login response
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
      SELECT users.Name, file_details.Room, file.Session, paper_collection.ID, paper_collection.Date
      FROM users
      INNER JOIN file_details ON file_details.User_ID = users.usr_ID
      INNER JOIN file ON file.File_ID = file_details.File_ID
      INNER JOIN paper_collection ON paper_collection.File_ID = file_details.File_ID AND paper_collection.User_ID = users.usr_ID
      WHERE users.Email = ?
      AND paper_collection.Date >= DATE(NOW())
      ORDER BY paper_collection.Date;
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

  const sessionTimes = [
    {start: 0, end: 5, session: 2},
    {start: 5, end: 12, session: 1},
    {start: 12, end: 18, session: 3},
    {start: 18, end: 24, session: 4},
  ];

  app.get('/getsession', (req, res) => {
    const email = req.query.email;
  
    // Get the current hour
    const currentHour = new Date().getHours();
  
    // Find the session number based on the current time
    let currentSession = 0;
    for (let i = 0; i < sessionTimes.length; i++) {
      if (currentHour >= sessionTimes[i].start && currentHour < sessionTimes[i].end) {
        currentSession = sessionTimes[i].session;
        break;
      }
    }
    console.log('Current Session: '+currentSession);
  
    const sql = `SELECT file.Session, paper_collection.ID as Paper_ID 
                FROM file 
                INNER JOIN paper_collection ON paper_collection.File_ID=file.File_ID 
                INNER JOIN users ON users.usr_ID=file.User_ID 
                WHERE paper_collection.User_ID=(Select usr_ID from users where email=?) 
                AND file.Session = ?
                ORDER BY file.Session`;
  
    db.query(sql, [email, currentSession], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error fetching session data');
      } else {
        const sessionData = results.map(result => result.Session);
        const currentSession = sessionData.length > 0 ? sessionData[0] : null;
        res.json({'sessionData': sessionData, 'currentSession': currentSession});
      }
    });
  });
  

  app.get('/getfacultymarkattendance', (req, res) => {
    const email = req.query.email;
  
    // Get the current hour
    const currentHour = new Date().getHours();
  
    // Find the session number based on the current time
    let currentSession = 0;
    for (let i = 0; i < sessionTimes.length; i++) {
      if (currentHour >= sessionTimes[i].start && currentHour < sessionTimes[i].end) {
        currentSession = sessionTimes[i].session;
        break;
      }
    }
  
    const sql = `SELECT file_details.Name, file_details.Room, file_details.Status, file.Session, paper_collection.ID
    FROM file_details 
    INNER JOIN file ON file_details.File_ID = file.File_ID 
    INNER JOIN paper_collection ON paper_collection.File_ID = file.File_ID 
    INNER JOIN users ON users.usr_ID = file_details.User_ID
    WHERE file_details.User_ID = (SELECT usr_ID FROM users WHERE email = ?) 
AND paper_collection.User_ID = file_details.User_ID
AND DATE(paper_collection.Date) = DATE(NOW()) 
AND file.Session = ?`;
  
    db.query(sql, [email, currentSession], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error fetching faculty data');
      } else {
        res.json(results);
      }
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
  fetch('http://yourip:3001/postattendancemarkedbyfaculty', options)
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error(error));
}


app.get('/getpapercollectionrecord', (req, res) => {
  const email = req.query.email;

  // Get the current hour
  const currentHour = new Date().getHours();
  
  // Find the session number based on the current time
  let currentSession = 0;
  for (let i = 0; i < sessionTimes.length; i++) {
    if (currentHour >= sessionTimes[i].start && currentHour < sessionTimes[i].end) {
      currentSession = sessionTimes[i].session;
      break;
    }
  }

  const sql = `SELECT file_details.Room, file.Session, paper_collection.ID, paper_collection.Status
  FROM file_details 
  INNER JOIN file ON file_details.File_ID = file.File_ID 
  INNER JOIN paper_collection ON paper_collection.File_ID = file.File_ID 
  INNER JOIN users ON users.usr_ID = file.User_ID
  WHERE file_details.User_ID =  (SELECT usr_ID FROM users WHERE email = ?) 
  AND paper_collection.User_ID = file_details.User_ID
    AND DATE(paper_collection.Date) = DATE(NOW()) 
    AND file.Session = ?`;

  db.query(sql, [email,currentSession], (error, results) => {
      if (error) {
          console.error(error);
          res.status(500).send('Error fetching paper collection record data');
      } else {
          res.json(results);
      }
  });
});

app.post('/postpapercollectionrecord', (req, res) => {
  console.log('Received postpapercollectionrecord request with body:', req.body);
  const { email, paperCollectionId, status } = req.body;
  console.log('email:', email);
  console.log('paperCollectionId:', paperCollectionId);
  console.log('status:', status);
  const sql = `UPDATE paper_collection 
               INNER JOIN users ON users.usr_ID=paper_collection.User_ID 
               SET paper_collection.status = ?
               WHERE paper_collection.ID = ? AND users.email = ?`;
  db.query(sql, [status, paperCollectionId, email], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error updating paper collection record');
    } else {
      console.log('Paper collection record updated successfully');
      const records = results;
      for (let i = 0; i < records.length; i++) {
        const paperId = records[i].ID;
        const selectedStatus = records[i].Status;
        console.log(`Sending paper collection data for email ${email} and paper ID ${paperId}, status: ${selectedStatus}`);
        sendPaperCollectionData(email, paperId, selectedStatus);
      }
      res.send(`Paper collection data sent successfully. Updated record for email ${email} and paper collection ID ${paperCollectionId}`);
    }
  });
});

function sendPaperCollectionData(email, paperId, status) {
  console.log(`Sending paper collection data for email ${email} and paper ID ${paperId}, status: ${status}`);
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, paperId: paperId, status: status })
  };
  fetch('http://yourip:3001/postpapercollectionrecord', options)
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

  

  app.get('/fetchfacultyattendancehistory', (req, res) => {
    const email = req.query.email;
  
    const sql = `SELECT file_details.Name, file_details.Room, file.Session, file_details.Status,paper_collection.ID, paper_collection.Date 
    FROM file_details 
    INNER JOIN file ON file_details.File_ID=file.File_ID  
    INNER JOIN paper_collection ON paper_collection.File_ID=file.File_ID  
    WHERE file_details.User_ID = (SELECT usr_ID FROM users WHERE email = ?) 
    AND paper_collection.User_ID= file_details.User_ID
    AND paper_collection.Date < DATE(NOW())
    ORDER BY paper_collection.Date
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
//app.listen(3001,()=>{console.log('yay')})
// server.listen(3000, () => {
//   console.log('API server listening on port 3000');
// });
