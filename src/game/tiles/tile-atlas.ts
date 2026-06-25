export const TILE_SIZE_PX = 16;
export const TILESHEET_GAP_PX = 0;
export const TILESHEET_COLUMNS = 12;
export const TILESHEET_ROWS = 11;
export const TILESHEET_PATH = '/game/tiles/tilemap_packed.png';

/**
 * Naming convention:
 * OBJ_PROPERTIES
 * where the directions of properties are the directions of where their corners are directing,
 * e.g., WALL_TR has the wall corner at BL but its corner is directing to TR
 * TILE_* are unused tiles for this game
 *
 * Numbered variants can be randomly cycled
 */
export enum TileId {
  RED_SAND_1 = 0,
  RED_SAND_WALL_TL = 1,
  RED_SAND_WALL_T = 2,
  RED_SAND_WALL_TR = 3,
  RED_SAND_2WALL_TL = 4,
  RED_SAND_2WALL_TR = 5,
  COLUMN_T = 6,
  WALL_DECOR_1 = 7,
  WALL_DECOR_2 = 8,
  DOOR_1_ROAD = 9,
  DOOR_L_ROAD = 10,
  DOOR_R_ROAD = 11,

  RED_SAND_2 = 12,
  RED_SAND_WALL_L = 13,
  RED_SAND_STONE = 14,
  RED_SAND_WALL_R = 15,
  RED_SAND_2WALL_BL = 16,
  RED_SAND_2WALL_BR = 17,
  COLUMN_C = 18,
  WALL_DECOR_3_T = 19,
  WALL_DECOR_4_T = 20,
  DOOR_1_OPEN = 21,
  DOOR_L_OPEN = 22,
  DOOR_R_OPEN = 23,

  RED_SAND_3 = 24,
  RED_SAND_WALL_BL = 25,
  RED_SAND_WALL_B = 26,
  RED_SAND_WALL_BR = 27,
  WALL_JAIL = 28,
  WALL_RED_FLAG = 29,
  COLUMN_B = 30,
  WALL_DECOR_3_B = 31,
  WALL_DECOR_4_B = 32,
  DOOR_1_HALF_CLOSED = 33,
  DOOR_L_HALF_CLOSED = 34,
  DOOR_R_HALF_CLOSED = 35,

  STONE_L = 36,
  STONE_C = 37,
  STONE_R = 38,
  STONE_STRAIGHT = 39,
  FLOOR_STONE = 40, // for blocking ways
  OBSTACLE_1 = 41,
  TILE_42 = 42,
  WALL_DECOR_3_B_ALT = 43,
  WALL_DECOR_4_B_ALT = 44,
  DOOR_1_CLOSED = 45,
  DOOR_L_CLOSED = 46,
  DOOR_2_CLOSED = 47,

  FLOOR = 48,
  TILE_49 = 49,
  TILE_50 = 50,
  TILE_51 = 51,
  TILE_52 = 52,
  TILE_53 = 53,
  TILE_54 = 54,
  TILE_55 = 55,
  TILE_56 = 56,
  BORDER_L = 57,
  BORDER_C = 58,
  BORDER_R = 59,

  OBSTACLE_2 = 60,
  OBSTACLE_3 = 61,
  OBSTACLE_4 = 62,
  SIMPLE_LOOT_OPEN = 63,
  TILE_64 = 64,
  TILE_65 = 65,
  OBSTACLE_5 = 66,
  TILE_67 = 67,
  TILE_68 = 68,
  TILE_69 = 69,
  TILE_70 = 70,
  TILE_71 = 71,

  TABLE = 72,
  TILE_73 = 73,
  TILE_74 = 74,
  SIMPLE_LOOT_CLOSED = 75,
  TILE_76 = 76,
  TILE_77 = 77,
  TILE_78 = 78,
  TILE_79 = 79,
  TILE_80 = 80,
  TILE_81 = 81,
  OBSTACLE_6 = 82,
  TILE_83 = 83,

  MAIN_NPC = 84,
  TILE_85 = 85,
  TILE_86 = 86,
  TILE_87 = 87,
  TILE_88 = 88,
  TILE_89 = 89,
  TILE_90 = 90,
  TILE_91 = 91,
  TILE_92 = 92,
  TILE_93 = 93,
  TILE_94 = 94,
  TILE_95 = 95,

  TILE_96 = 96,
  TILE_97 = 97,
  TILE_98 = 98,
  TILE_99 = 99,
  TILE_100 = 100,
  TILE_101 = 101,
  TILE_102 = 102,
  TILE_103 = 103,
  TILE_104 = 104,
  TILE_105 = 105,
  TILE_106 = 106,
  TILE_107 = 107,

  TILE_108 = 108,
  TILE_109 = 109,
  TILE_110 = 110,
  TILE_111 = 111,
  TILE_112 = 112,
  AWARD_1 = 113,
  AWARD_2 = 114,
  AWARD_3 = 115,
  AWARD_4 = 116,
  AWARD_5 = 117,
  AWARD_6 = 118,
  AWARD_7 = 119,

  TILE_120 = 120,
  TILE_121 = 121,
  TILE_122 = 122,
  TILE_123 = 123,
  TILE_124 = 124,
  TILE_125 = 125,
  TILE_126 = 126,
  TILE_127 = 127,
  TILE_128 = 128,
  TILE_129 = 129,
  TILE_130 = 130,
  TILE_131 = 131,
}

export interface TileFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getTileFrame(tileId: TileId): TileFrame {
  const index = Number(tileId);
  const column = index % TILESHEET_COLUMNS;
  const row = Math.floor(index / TILESHEET_COLUMNS);

  return {
    x: column * (TILE_SIZE_PX + TILESHEET_GAP_PX),
    y: row * (TILE_SIZE_PX + TILESHEET_GAP_PX),
    width: TILE_SIZE_PX,
    height: TILE_SIZE_PX,
  };
}
