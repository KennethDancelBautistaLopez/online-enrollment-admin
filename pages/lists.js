import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Login from "@/pages/Login";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { generatePDFfile } from "@/components/generatePDFfile";

export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:3000/api/students');
    const data = await res.json();

    return {
      props: {
        initialStudents: data || [],
      },
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    return {
      props: {
        initialStudents: [],
      },
    };
  }
}

export default function Students({ initialStudents }) {
  const [students, setStudents] = useState(initialStudents || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfLinks, setPdfLinks] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const { data: session } = useSession();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    axios.get("/api/students").then((response) => {
      setStudents(response.data);
      toast.success("Students loaded successfully! ✅");
    }).catch((error) => {
      toast.error("Failed to load students.");
      console.error(error);
    });
  }, [session]);

  useEffect(() => {
    if (!session) toast.error("You don't have permission to access this page.");
  }, [session]);

  if (!session) return <Login />;

  const handleGeneratePDF = (student) => {
    const pdfLink = generatePDFfile(student);
    setPdfLinks((prev) => ({
      ...prev,
      [student._studentId]: pdfLink,
    }));
    toast.success(`PDF generated for ${student.fname} ${student.lname}!`);
  };

  const updateStudentStatus = async (studentId, status) => {
    try {
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setStudents((prev) =>
        prev.map((student) =>
          student._studentId === studentId ? { ...student, status } : student
        )
      );
      toast.success("Student status updated!");
    } catch (err) {
      toast.error("Failed to update status.");
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024;

    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      toast.error("Only JPEG and PDF are allowed.");
      e.target.value = '';
      return;
    }

    if (selectedFile && selectedFile.size > maxSize) {
      toast.error("File too large. Max 10MB.");
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (studentId) => {
    if (!file) {
      toast.error("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', studentId);

    try {
      setUploading(true);
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { filePath } = res.data;
      setStudents((prev) =>
        prev.map((s) => s._studentId === studentId ? { ...s, filePath } : s)
      );
      toast.success("File uploaded!");
    } catch (err) {
      toast.error("Upload failed.");
      console.error(err);
    } finally {
      setUploading(false);
      setFile(null);
      setSelectedStudentId(null);
    }
  };

  const triggerFileSelection = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // 🔍 Filter students based on search
  const filteredStudents = students.filter((student) =>
    `${student.fname} ${student.lname} ${student.email} ${student._studentId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Login>
      <div className="container mx-auto p-6">
        <div className="flex flex-col  md:flex-row justify-between items-center mb-2">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">List of Students</h1>
        </div>

        {/* 🔍 Search Bar */}
        <input
          type="text"
          placeholder="Search by Name, Email or Student Number"
          className="w-full p-3 mb-6 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full text-left table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-4">#</th>
                <th className="border p-4">Student Number</th>
                <th className="border p-4">Name</th>
                <th className="border p-4">Email</th>
                <th className="border p-4">Files</th>
                <th className="border p-4">Upload Files</th>
                <th className="border p-4">Status</th>
                <th className="border p-4">Download</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-gray-500">No students found</td></tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student._studentId} className="hover:bg-gray-50">
                    <td className="border p-4 text-center">{index + 1}</td>
                    <td className="border p-4">{student._studentId}</td>
                    <td className="border p-4">{student.fname} {student.mname} {student.lname}</td>
                    <td className="border p-4">{student.email}</td>
                    <td className="border p-4 text-center">
                      {student.filePath && (
                        <a href={`/uploads/${student._studentId}-download.jpg`} target="_blank" className="btn-primary text-sm px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                          View
                        </a>
                      )}
                    </td>
                    <td className="border p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedStudentId(student._studentId);
                          triggerFileSelection();
                        }}
                        className="btn-primary text-sm px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        Upload
                      </button>
                      {selectedStudentId === student._studentId && file && (
                        <div className="mt-2">
                          <span>{file.name}</span>
                          <button
                            onClick={() => handleUpload(student._studentId)}
                            disabled={uploading}
                            className="btn-primary text-sm px-3 py-2 mt-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                          >
                            {uploading ? "Uploading..." : "Upload File"}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="border p-4">
                      <select
                        value={student.status}
                        onChange={(e) => updateStudentStatus(student._studentId, e.target.value)}
                        className="bg-white border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="enrolled">Enrolled</option>
                        <option value="graduated">Graduated</option>
                        <option value="dropped">Dropped</option>
                        <option value="missing files">Missing Files</option>
                      </select>
                    </td>
                    <td className="border p-4 text-center">
                      {pdfLinks[student._studentId] ? (
                        <a
                          href={pdfLinks[student._studentId]}
                          download={`${student.fname}_${student.lname}_info.pdf`}
                          className="btn-primary text-sm px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-green-600"
                        >
                          Download
                        </a>
                      ) : (
                        <button
                          onClick={() => handleGeneratePDF(student)}
                          className="btn-primary text-sm px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-green-600"
                        >
                          Generate PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Login>
  );
}
