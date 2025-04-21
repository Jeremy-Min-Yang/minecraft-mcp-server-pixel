#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pathfinderPkg;
import { Vec3 } from 'vec3';
import minecraftData from 'minecraft-data';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// ========== Type Definitions ==========
// ... rest of the file remains unchanged, as there are no yukino-specific variable names in the logic ... 

yargs(hideBin(process.argv))
  .option('username', {
    type: 'string',
    description: 'Bot username',
    default: 'Bob_the_Builder'
  })
  .parse(); 