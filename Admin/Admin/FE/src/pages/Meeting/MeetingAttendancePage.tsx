import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Box,
  Divider,
  Card,
} from "@mui/material";

const MeetingAttendancePage: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get("https://admin-be-qe74.onrender.com/api/meeting-attendance")
      .then((res) => {
        setMeetings(res.data);
        setFilteredMeetings(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    const filtered = meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(value.toLowerCase()) ||
        m.department_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMeetings(filtered);
  };

  const viewAttendance = async (meetingId: number) => {
    setSelectedMeeting(meetingId);
    try {
      const res = await axios.get(
        `https://admin-be-qe74.onrender.com/api/meeting-attendance/${meetingId}`
      );
      setAttendance(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 6,
        mb: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: "#f9fafc",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: "bold",
          color: "#3f51b5",
          textAlign: "center",
        }}
      >
        Meeting Attendance Dashboard
      </Typography>

      <TextField
        label="Search by Title or Department"
        variant="outlined"
        fullWidth
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        sx={{
          mb: 4,
          maxWidth: "800px",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      />

      <Card
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: "1100px",
          p: 3,
          borderRadius: 3,
          bgcolor: "white",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: "#333",
            fontWeight: 600,
            borderBottom: "2px solid #3f51b5",
            pb: 1,
          }}
        >
          All Meetings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f0f3ff" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Host</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMeetings.map((m) => (
              <TableRow
                key={m.meeting_id}
                sx={{
                  "&:hover": { bgcolor: "#f5f5f5", cursor: "pointer" },
                  transition: "0.2s ease",
                }}
              >
                <TableCell>{m.title}</TableCell>
                <TableCell>
                  {new Date(m.date_time).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>{m.department_name}</TableCell>
                <TableCell>{m.host_name}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#3f51b5",
                      "&:hover": { bgcolor: "#2c387e" },
                      borderRadius: 2,
                    }}
                    onClick={() => viewAttendance(m.meeting_id)}
                  >
                    View Attendance
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedMeeting && (
        <div style={{ width: "100%", maxWidth: "1100px", marginTop: "40px" }}>
          <Card
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: "#3f51b5",
                fontWeight: 600,
                borderBottom: "2px solid #3f51b5",
                pb: 1,
              }}
            >
              Attendance for Meeting #{selectedMeeting}
            </Typography>
            {attendance.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f0f3ff" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Employee Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((a, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        "&:hover": { bgcolor: "#f9f9ff" },
                      }}
                    >
                      <TableCell>{a.employee_name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            bgcolor:
                              a.status === "PRESENT"
                                ? "#C8E6C9"
                                : "#FFCDD2",
                            color:
                              a.status === "PRESENT"
                                ? "#2E7D32"
                                : "#C62828",
                            fontWeight: "bold",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            textAlign: "center",
                            display: "inline-block",
                          }}
                        >
                          {a.status}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ mt: 2, color: "#888" }}>
                No attendance records found for this meeting.
              </Typography>
            )}
          </Card>
        </div>
      )}
    </Container>
  );
};

export default MeetingAttendancePage;