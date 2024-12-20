import { Request, Response } from 'express';
import connection from '../database/database';
import { OkPacket } from 'mysql2'; 
import { RowDataPacket } from 'mysql2/';
// CHỨC NĂNG USER
  //1. Xem Thông tin tất cả các chuyến bay 
export const getAllFlights = (req: Request, res: Response) => {
  const query = 'SELECT * FROM Flights';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results); 
  });
};
  //2.Tìm chuyến bay 
  // Chức năng tìm chuyến bay với Model tàu bay
export const searchFlights = (req: Request, res: Response): void => {
  // Lấy flightID từ body của request
  const { FlightID } = req.body;

  // Kiểm tra xem flightID có tồn tại không
  if (!FlightID) {
    res.status(400).json({ message: 'FlightID is required' });
    return;
  }

  // Truy vấn tìm chuyến bay theo flightID và lấy thông tin Model tàu bay
  const query = `
    SELECT 
      f.FlightID, f.Departure, f.Arrival, f.DepartureTime, f.ArrivalTime, f.Price, f.SeatsAvailable, f.Status, 
      a.Model AS AircraftModel 
    FROM Flights f
    JOIN Aircrafts a ON f.AircraftTypeID = a.AircraftID
    WHERE f.FlightID = ?
  `;

  connection.query(query, [FlightID], (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      res.status(500).json({ message: 'Internal Server Error', error: err.message });
      return;
    }

    // Ép kiểu kết quả thành RowDataPacket[]
    const flightResults = results as RowDataPacket[];

    // Kiểm tra nếu không có chuyến bay nào được tìm thấy
    if (flightResults.length === 0) {
      res.status(404).json({ message: 'Flight not found' });
      return;
    }

    // Trả về chuyến bay đầu tiên nếu có, bao gồm Model tàu bay
    res.status(200).json(flightResults[0]);
  });
};

//3. Đặt vé
export const bookFlight = (req: Request, res: Response): void => {
  const { UserID, FlightID } = req.body;
  // Check 2 trường userID và flightID xem có hợp lệ không 
  if (!FlightID) {
    res.status(400).json({ message: 'Missing required fields: FlightID' });
    return;
  }
  if (!UserID) {
    res.status(400).json({ message: 'Missing required fields: UserID' });
    return;
  }
  const flightQuery = 'SELECT * FROM Flights WHERE FlightID = ?';
  connection.query(flightQuery, [FlightID], (err, results) => {
    if (err) {
      console.error('Error querying flights:', err);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    const FlightResults = results as RowDataPacket[];
    if (FlightResults.length === 0) {
      res.status(404).json({ message: 'Flight not found' });
      return;
    }

    const flight = FlightResults[0];

    //Check SeatsAvailable
    if (flight.SeatsAvailable <= 0) {
      res.status(400).json({ message: 'No seats available for this flight' });
      return;
    }
    const checkBookingQuery = 'SELECT * FROM Bookings WHERE UserID = ? AND FlightID = ?';
    connection.query(checkBookingQuery, [UserID, FlightID], (err, results) => {
      if (err) {
        console.error('Error checking existing booking:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      const bookingResults = results as RowDataPacket[];
      // Nếu đã đặt vé
      if (bookingResults.length > 0 && bookingResults[0].BookingStatus === 'confirmed') {
        res.status(400).json({ message: 'User has already confirmed booking for this flight' });
        return;
      }

      // Nếu vé đã bị hủy --> update trạng thái thành "confirmed"
      if (bookingResults.length > 0 && bookingResults[0].BookingStatus === 'cancelled') {
        const bookingID = bookingResults[0].BookingID;
        const updateBookingQuery = 'UPDATE Bookings SET BookingStatus = "confirmed", BookingDate = NOW() WHERE BookingID = ?';
        connection.query(updateBookingQuery, [bookingID], (err, results) => {
          if (err) {
            console.error('Error updating booking status:', err);
            res.status(500).json({ message: 'Failed to update booking status' });
            return;
          }
          // Update SeatAvailable
          const updateSeatsQuery = 'UPDATE Flights SET SeatsAvailable = SeatsAvailable - 1 WHERE FlightID = ?';
          connection.query(updateSeatsQuery, [FlightID], (err, results) => {
            if (err) {
              console.error('Error updating flight seats:', err);
              res.status(500).json({ message: 'Failed to update flight seat availability' });
              return;
            }

            // Trả message nếu đặt lại vé thành công 
            res.status(201).json({
              message: 'Booking re-confirmed successfully, flight re-booked',
              bookingID,
              FlightID,
              UserID,
            });
          });
        });
      } else {
        // Nếu chưa hủy vé trước đó, cho phép đặt vé mới (không trùng userID,flightID)
        const bookingQuery = 'INSERT INTO Bookings (UserID, FlightID) VALUES (?, ?)';
        connection.query(bookingQuery, [UserID, FlightID], (err, results) => {
          if (err) {
            console.error('Error creating booking:', err);
            res.status(500).json({ message: 'Failed to create booking' });
            return;
          }

          const bookingID = (results as OkPacket).insertId;

          // Update SeatsAvailable
          const updateFlightQuery = 'UPDATE Flights SET SeatsAvailable = SeatsAvailable - 1 WHERE FlightID = ?';
          connection.query(updateFlightQuery, [FlightID], (err, results) => {
            if (err) {
              console.error('Error updating flight seats:', err);
              res.status(500).json({ message: 'Failed to update flight seat availability' });
              return;
            }

            // Trả message nếu đặt vé thành công 
            res.status(201).json({
              message: 'Booking confirmed',
              bookingID,
              FlightID,
              UserID,
            });
          });
        });
      }
    });
  });
};
//4. Hủy vé
export const cancelBooking = (req: Request, res: Response): void => {
  const { userID, bookingID } = req.body;
  // Check userID,bookingID có tồn tại ko
  if (!userID || !bookingID) {
    res.status(400).json({ message: 'Missing required fields: userID or bookingID' });
    return;
  }
  const bookingQuery = 'SELECT * FROM Bookings WHERE BookingID = ? AND UserID = ?';
  connection.query(bookingQuery, [bookingID, userID], (err, results) => {
    if (err) {
      console.error('Error querying booking:', err);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    const bookingResults = results as RowDataPacket[];
    if (bookingResults.length === 0) {
      res.status(404).json({ message: 'Booking not found or does not belong to user' });
      return;
    }
    const booking = bookingResults[0];
    const flightID = booking.FlightID;

    // Check có còn đủ thời gian để hủy vé không ?
    const flightQuery = 'SELECT * FROM Flights WHERE FlightID = ?';
    connection.query(flightQuery, [flightID], (err, results) => {
      if (err) {
        console.error('Error querying flights:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      const flightResults = results as RowDataPacket[];
      if (flightResults.length === 0) {
        res.status(404).json({ message: 'Flight not found' });
        return;
      }
      const flight = flightResults[0];
      const departureTime = new Date(flight.DepartureTime);
      const currentTime = new Date();
      const timeDifference = departureTime.getTime() - currentTime.getTime();
      const MIN_CANCEL_TIME = 2 * 60 * 60 * 1000; // Tối thiếu 2 giờ trước khi cất cánh 
      if (timeDifference < MIN_CANCEL_TIME) {
        res.status(400).json({ message: 'Cannot cancel booking, less than 3 hours before flight' });
        return;
      }
      // Update trạng thái thành "Cancelled"
      const cancelBookingQuery = 'UPDATE Bookings SET BookingStatus = "cancelled" WHERE BookingID = ?';
      connection.query(cancelBookingQuery, [bookingID], (err, results) => {
        if (err) {
          console.error('Error canceling booking:', err);
          res.status(500).json({ message: 'Failed to cancel booking' });
          return;
        }

      //Update SeatsAvailable
        const updateSeatsQuery = 'UPDATE Flights SET SeatsAvailable = SeatsAvailable + 1 WHERE FlightID = ?';
        connection.query(updateSeatsQuery, [flightID], (err, results) => {
          if (err) {
            console.error('Error updating seats available:', err);
            res.status(500).json({ message: 'Failed to update seat availability' });
            return;
          }

          // Trả về thông báo thành công
          res.status(200).json({ message: 'Booking cancelled successfully' });
        });
      });
    });
  });
};
  //5. Theo dõi thông tin chuyến bay đã đặt của User
export const getUserFlights = (req: Request, res: Response): void => {
  const { userID } = req.body;  // Lấy userID từ query params
  if (!userID) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }
    // Truy vấn từ Table Bookings và Flights
  const query = `
    SELECT 
      b.BookingID, b.BookingDate, b.BookingStatus, b.PaymentStatus, 
      f.FlightID, f.AircraftTypeID, f.Departure, f.Arrival, f.DepartureTime, f.ArrivalTime, f.Price, f.SeatsAvailable, f.Status AS FlightStatus
    FROM Bookings b
    JOIN Flights f ON b.FlightID = f.FlightID
    WHERE b.UserID = ?
  `;
  connection.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Error executing query:', err.stack);
      res.status(500).json({ message: 'Internal Server Error', error: err.message });
      return;
    }

    // Không có results 
    if ((results as any).length === 0) {
      res.status(404).json({ message: 'No booking found for this user' });
      return;
    }

    // Có results
    res.status(200).json(results);
  });
};
//CHỨC NĂNG ADMIN
  //1. Tạo thông tin
  export const CreateOffer = (req: Request, res: Response): void => {
  const { title, content, UserID } = req.body;

  // Kiểm tra xem các trường dữ liệu có đầy đủ hay không
  if (!title || !content || !UserID) {
    res.status(400).json({ message: 'Missing required fields: title, content, or UserID' });
    return;
  }

  // Kiểm tra xem người dùng có phải là admin hay không
  const adminQuery = 'SELECT Role FROM Users WHERE UserID = ?';
  connection.query(adminQuery, [UserID], (err, results: any) => {
    if (err) {
      console.error('Error checking user role:', err);
      res.status(500).json({ message: 'Failed to verify user role' });
      return;
    }

    // Kiểm tra kết quả trả về có hợp lệ không và người dùng có Role là Admin
    if (!Array.isArray(results) || results.length === 0 || results[0].Role !== 'Admin') {
      res.status(403).json({ message: 'Permission denied: User is not an admin' });
      return;
    }

    // Thực hiện tạo Offer nếu người dùng là admin
    const query = 'INSERT INTO Offers (Title, Content) VALUES (?, ?)';
    connection.query(query, [title, content, UserID], (err, results: any) => {
      if (err) {
        console.error('Error inserting notification:', err);
        res.status(500).json({ message: 'Failed to create Offer' });
        return;
      }
      res.status(201).json({
        message: 'Offer created successfully',
      });
    });
  });
};

//2. Lấy danh sách Offers
  export const getAllOffers = (req: Request, res: Response): void => {
    const query = 'SELECT PostID,Title,Content,PostDate FROM Offers';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }
      // Nếu không có kết quả
      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No offers found' });
        return;
      }
      // Trả về tất cả các offers
      res.status(200).json(results);
    });
  };

//3. Nhập dữ liệu tàu bay 
  export const addAircraft = (req: Request, res: Response): void => {
    const { Model, Manufacturer, Capacity, RangeKm, Description, UserID } = req.body;
  
    if (!Model || !Manufacturer || !Capacity || !RangeKm || !UserID) {
      res.status(400).json({
        message: 'Missing required fields: Model, Manufacturer, Capacity, RangeKm, or UserID',
      });
      return;
    }
  
    const checkQuery = `
      SELECT * FROM Aircrafts 
      WHERE Model = ? AND Manufacturer = ?
    `;
  
    connection.query(checkQuery, [Model, Manufacturer], (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({
          message: 'Internal Server Error',
          error: err.message,
        });
        return;
      }
  
      if ((results as RowDataPacket[]).length > 0) {
        res.status(400).json({
          message: 'Aircraft with the same Model and Manufacturer already exists',
        });
        return;
      }
  
      const insertQuery = `
        INSERT INTO Aircrafts (Model, Manufacturer, Capacity, RangeKm, Description, CreatedBy) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
  
      connection.query(insertQuery, [Model, Manufacturer, Capacity, RangeKm, Description, UserID], (err, results) => {
        if (err) {
          console.error('Error executing query:', err.stack);
          res.status(500).json({
            message: 'Internal Server Error',
            error: err.message,
          });
          return;
        }
  
        const aircraftID = (results as OkPacket).insertId;
  
        res.status(201).json({
          message: 'Aircraft added successfully',
          aircraftID,
        });
      });
    });
  };
  //4. Xóa Offer
  export const deleteOffer = (req: Request, res: Response): void => {
    const { postID, UserID } = req.body;
  
    if (!postID || !UserID) {
      res.status(400).json({ message: 'Missing required fields: postID or UserID' });
      return;
    }
  
    const query = 'DELETE FROM Offers WHERE PostID = ? AND CreatedBy = ?';
    connection.query(query, [postID, UserID], (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }
  
      const result = results as OkPacket;
  
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Offer not found or user does not have permission' });
        return;
      }
  
      res.status(200).json({ message: 'Offer deleted successfully' });
    });
  };
  //5. Nhập dữ liệu Chuyến bay
  export const addFlight = (req: Request, res: Response): void => {
    const { AircraftTypeID, Departure, Arrival, DepartureTime, ArrivalTime, Price, SeatsAvailable, Status, UserID } = req.body;
  
    if (!AircraftTypeID || !Departure || !Arrival || !DepartureTime || !ArrivalTime || !Price || !SeatsAvailable || !Status || !UserID) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
  
    const query = `
      INSERT INTO Flights (AircraftTypeID, Departure, Arrival, DepartureTime, ArrivalTime, Price, SeatsAvailable, Status, CreatedBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    connection.query(query, [AircraftTypeID, Departure, Arrival, DepartureTime, ArrivalTime, Price, SeatsAvailable, Status, UserID], (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }
  
      const flightID = (results as OkPacket).insertId;
  
      res.status(201).json({ message: 'Flight added successfully', flightID });
    });
  };
  //6. Xóa chuyến bay
  export const deleteFlight = (req: Request, res: Response): void => {
    const { flightID, UserID } = req.body;
  
    if (!flightID || !UserID) {
      res.status(400).json({ message: 'Missing required fields: flightID or UserID' });
      return;
    }
  
    const query = 'DELETE FROM Flights WHERE FlightID = ? AND CreatedBy = ?';
  
    connection.query(query, [flightID, UserID], (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }
  
      const result = results as OkPacket;
  
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Flight not found or user does not have permission' });
        return;
      }
  
      const vietnamTime = new Date();
      vietnamTime.setHours(vietnamTime.getHours());
      const timestamp = vietnamTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  
      res.status(200).json({
        message: 'Flight deleted successfully',
        timestampMessage: `Flight deleted at ${timestamp}`,
      });
    });
  };
  

