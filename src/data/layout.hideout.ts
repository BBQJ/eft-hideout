export interface HideoutRoomOutline {
  id: string
  path: string
}

export interface HideoutLayoutSpec {
  width: number
  height: number
  stationAnchors: Record<string, { x: number; y: number }>
  roomOutlines: HideoutRoomOutline[]
}

export const HIDEOUT_LAYOUT: HideoutLayoutSpec = {
  width: 800,
  height: 700,
  stationAnchors: {
    Security: { x: 87, y: 611 },
    Vents: { x: 225, y: 393 },
    Heating: { x: 680, y: 470 },
    Stash: { x: 225, y: 275 },
    Workbench: { x: 321, y: 115 },
    Generator: { x: 355, y: 470 },
    'Intelligence Center': { x: 321, y: 235 },
    Illumination: { x: 321, y: 393 },
    'Water Collector': { x: 405, y: 375 },

    'Hall of Fame': { x: 425, y: 115 },
    'Weapon Rack': { x: 271, y: 185 },
    Medstation: { x: 625, y: 375 },

    'Air Filtering Unit': { x: 580, y: 470 },
    'Booze Generator': { x: 485, y: 375 },
    Lavatory: { x: 225, y: 135 },
    'Bitcoin Farm': { x: 321, y: 323 },
    'Rest Space': { x: 705, y: 375 },
    Library: { x: 755, y: 430 },

    'Solar Power': { x: 285, y: 470 },
    'Nutrition Unit': { x: 485, y: 470 },
    'Scav Case': { x: 190, y: 541 },
    'Shooting Range': { x: 271, y: 41 },
    'Gear Rack': { x: 425, y: 275 },

    'Cultist Circle': { x: 250, y: 615 },
    Gym: { x: 670, y: 90 },
    'Defective Wall': { x: 555, y: 375 },
  },
  roomOutlines: [
    {
      id: 'cultist-room',
      path: 'M 254.174 538.402 L 329.837 615.428 L 247.238 696.566 L 171.574 619.54 Z',
    },
    {
      id: 'gym-wall',
      path: 'M 755.209 340.443 L 755.209 40.443 L 358 40.443',
    },
    {
      id: 'main-wall',
      path: 'M 224.432 567.617 L 104.824 685.11 L 11.497 590.102 L 189 415.739 L 189 7.3 L 358 7.3 L 358 340.443 L 545.2 340.443',
    },
    {
      id: 'main-wall-2',
      path: 'M 565.194 340.443 L 793 340.443 L 793 510.443 L 282.636 510.443 L 238.736 553.566',
    },
    {
      id: 'door-main',
      path: 'M 548.186 340.443 L 562.214 340.443',
    },
    {
      id: 'door-cult',
      path: 'M 236.599 555.62 L 226.611 565.471',
    },
  ],
}
