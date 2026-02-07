 export interface GroundTile {
   id: string;
   name: string;
  image: string;
 }
 
import grassImg from "@/assets/tiles/grass.png";
import wheatImg from "@/assets/tiles/wheat.png";
import rockImg from "@/assets/tiles/rock.png";
import rock2Img from "@/assets/tiles/rock2.png";
import marshImg from "@/assets/tiles/marsh.png";
import cobblestoneImg from "@/assets/tiles/cobblestone.png";
import woodImg from "@/assets/tiles/wood.png";
import woodPlanksImg from "@/assets/tiles/wood-planks.png";
import carpetImg from "@/assets/tiles/carpet.png";
import chessImg from "@/assets/tiles/chess.png";

 export const groundTiles: GroundTile[] = [
   {
     id: "grass",
     name: "Grass Turf",
    image: grassImg,
   },
   {
    id: "wheat",
    name: "Savanna/Wheat Turf",
    image: wheatImg,
   },
   {
     id: "rocky",
     name: "Rocky Turf",
    image: rockImg,
  },
  {
    id: "rocky2",
    name: "Rocky Turf 2",
    image: rock2Img,
   },
   {
     id: "marsh",
     name: "Marsh Turf",
    image: marshImg,
   },
   {
    id: "chess",
    name: "Chess Turf",
    image: chessImg,
   },
   {
     id: "cobblestone",
     name: "Cobblestones",
    image: cobblestoneImg,
   },
   {
    id: "wood",
    name: "Wooden Tiles",
    image: woodImg,
  },
  {
    id: "wood-planks",
    name: "Wood Planks",
    image: woodPlanksImg,
   },
   {
     id: "carpet",
     name: "Carpet",
    image: carpetImg,
   },
 ];