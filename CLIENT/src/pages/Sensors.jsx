import React from "react";
import { Box, SimpleGrid, Flex, Text } from "@chakra-ui/react";
import { MdBolt, MdThermostat, MdBatteryChargingFull } from "react-icons/md";

const sensorList = [
  {
    name: "Voltage Sensor",
    status: "Active",
    icon: <MdBolt />,
    value: "12.4V",
  },
  {
    name: "Temperature Sensor",
    status: "Active",
    icon: <MdThermostat />,
    value: "36.2°C",
  },
  {
    name: "Current Sensor",
    status: "Active",
    icon: <MdBatteryChargingFull />,
    value: "1.1A",
  },
];

const Sensors = () => {
  return (
    <Box bg="blue.800" borderRadius="xl" boxShadow="lg" p={6} mb={8}>
      <Text color="white" fontSize="lg" fontWeight="semibold" mb={4}>
        Sensors
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
        {sensorList.map((sensor, idx) => (
          <Flex
            key={idx}
            align="center"
            bg="blue.900"
            borderRadius="lg"
            p={4}
            boxShadow="md"
          >
            <Box color="teal.300" fontSize="3xl" mr={4}>
              {sensor.icon}
            </Box>
            <Box>
              <Text color="white" fontWeight="medium">
                {sensor.name}
              </Text>
              <Text color="gray.400" fontSize="sm">
                {sensor.status}
              </Text>
              <Text color="teal.300" fontSize="lg" fontWeight="bold">
                {sensor.value}
              </Text>
            </Box>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Sensors;
