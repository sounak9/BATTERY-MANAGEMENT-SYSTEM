import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import DataLogs from "./pages/DataLogs";
import Sensors from "./pages/Sensors";

export default function App() {
  return (
    <BrowserRouter>
      <Box minH="100vh" bg="#1A2B5B">
        <Header />
        <Flex>
          <Sidebar />
          <Box flex="1" p={{ base: 6, md: 8 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/data-logs" element={<DataLogs />} />
              <Route path="/sensors" element={<Sensors />} />
            </Routes>
          </Box>
        </Flex>
      </Box>
    </BrowserRouter>
  );
}
