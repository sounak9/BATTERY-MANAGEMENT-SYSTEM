import React from "react";
import { VStack, Box, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdSettings,
  MdList,
  MdSensors,
  MdLogout,
} from "react-icons/md";

const sidebarItems = [
  { to: "/", icon: <MdDashboard size={28} />, label: "Dashboard" },
  { to: "/settings", icon: <MdSettings size={28} />, label: "Settings" },
  { to: "/data-logs", icon: <MdList size={28} />, label: "Data Logs" },
  { to: "/sensors", icon: <MdSensors size={28} />, label: "Sensors" },
];

const Sidebar = () => (
  <Box
    bg="#14234C"
    w="80px"
    py={8}
    px={2}
    minH="calc(100vh - 64px)"
    boxShadow="xl"
    borderRightRadius="xl"
    display="flex"
    flexDirection="column"
    alignItems="center"
  >
    <VStack spacing={8} align="center" w="100%">
      {sidebarItems.map((item, idx) => (
        <NavLink
          key={item.label}
          to={item.to}
          style={{ width: "100%" }}
          className={({ isActive }) => (isActive ? "sidebar-item-active" : "")}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            cursor="pointer"
            color="gray.400"
            _hover={{ color: "white", transform: "scale(1.05)" }}
            transition="all 0.2s"
          >
            {item.icon}
            <Text fontSize="xs" fontWeight="medium">
              {item.label}
            </Text>
          </Box>
        </NavLink>
      ))}
    </VStack>
    <Box flexGrow={1} /> {/* Spacer to push logout down */}
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      cursor="pointer"
      color="gray.400"
      _hover={{ color: "white" }}
    >
      <MdLogout size={28} style={{ marginBottom: 8 }} />
      <Text fontSize="xs" fontWeight="medium">
        Logout
      </Text>
    </Box>
  </Box>
);

export default Sidebar;
