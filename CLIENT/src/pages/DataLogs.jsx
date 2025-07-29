import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { fetchSensorLogs } from "../api/sensor.js";

export default function DataLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSensorLogs()
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box bg="blue.800" borderRadius="xl" boxShadow="lg" p={6} mb={8}>
      <Text color="white" fontSize="lg" fontWeight="semibold" mb={4}>
        Data Logs
      </Text>
      <Box overflowX="auto">
        {loading ? (
          <Spinner color="teal.300" />
        ) : (
          <Table variant="simple" colorScheme="teal">
            <Thead>
              <Tr>
                <Th color="gray.400">Time</Th>
                <Th color="gray.400">Voltage</Th>
                <Th color="gray.400">Temp</Th>
                <Th color="gray.400">Current</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map((log, idx) => (
                <Tr key={idx}>
                  <Td color="gray.300">{log.timestamp}</Td>
                  <Td color="gray.300">{log.voltage}</Td>
                  <Td color="gray.300">{log.temperature}</Td>
                  <Td color="gray.300">{log.current}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
