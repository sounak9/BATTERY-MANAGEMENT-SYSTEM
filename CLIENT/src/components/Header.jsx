import React from "react";
import { Flex, Box, Text, Icon } from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";

const Header = () => (
  <Flex
    bg="#14234C"
    h="64px"
    align="center"
    justify="space-between"
    px={6}
    boxShadow="xl"
    borderBottomRadius="xl"
  >
    <Box>
      <Text
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="bold"
        color="white"
        letterSpacing="wide"
      >
        Battery Monitoring Dashboard
      </Text>
    </Box>
    <Flex align="center" gap={4}>
      <Icon
        as={FaUserCircle}
        color="gray.300"
        boxSize={10}
        cursor="pointer"
        transition="all 0.3s"
        _hover={{ color: "white", transform: "scale(1.1)" }}
      />
    </Flex>
  </Flex>
);

export default Header;
