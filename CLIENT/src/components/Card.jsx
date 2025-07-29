import React from "react";
import { Box, Text } from "@chakra-ui/react";

const Card = ({ title, value, unit, description }) => (
  <Box
    bg="#14234C"
    p={6}
    borderRadius="xl"
    boxShadow="lg"
    textAlign="center"
    color="white"
    transition="transform 0.3s"
    _hover={{ transform: "scale(1.05)" }}
  >
    <Text color="gray.400" fontSize="sm" mb={2}>
      {title}
    </Text>
    <Text fontSize="5xl" fontWeight="bold">
      {value}
      {unit}
    </Text>
    <Text color="gray.400" fontSize="sm" mt={2}>
      {description}
    </Text>
  </Box>
);

export default Card;
