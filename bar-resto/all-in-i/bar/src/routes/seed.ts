import { BeverageCategoryType } from "@prisma/client";
import prisma from "../lib/prisma";
import { Router } from "express";

const router = Router();

router.get("/seed", async (req, res) => {
    const seed = [
        {
          "id": 1,
          "name": "Beer",
          "description": "Various types of beer and ale",
          "type": "ALCOHOLIC"
        },
        {
          "id": 2,
          "name": "Wine",
          "description": "Red, white, rosé, and sparkling wines",
          "type": "ALCOHOLIC"
        },
        {
          "id": 3,
          "name": "Spirits",
          "description": "Distilled alcoholic beverages",
          "type": "ALCOHOLIC"
        },
        {
          "id": 4,
          "name": "Cocktails",
          "description": "Mixed drinks and classic cocktails",
          "type": "ALCOHOLIC"
        },
        {
          "id": 5,
          "name": "Liqueurs",
          "description": "Sweetened spirits with various flavors",
          "type": "ALCOHOLIC"
        },
        {
          "id": 6,
          "name": "Fortified Wine",
          "description": "Wine with added spirits like port and sherry",
          "type": "ALCOHOLIC"
        },
        {
          "id": 7,
          "name": "Sake",
          "description": "Japanese rice wine",
          "type": "ALCOHOLIC"
        },
        {
          "id": 8,
          "name": "Soju",
          "description": "Korean distilled beverage",
          "type": "ALCOHOLIC"
        },
        {
          "id": 9,
          "name": "Cider",
          "description": "Alcoholic beverage from fermented apples",
          "type": "ALCOHOLIC"
        },
        {
          "id": 10,
          "name": "Mead",
          "description": "Alcoholic beverage from fermented honey",
          "type": "ALCOHOLIC"
        },
        {
          "id": 11,
          "name": "Hard Seltzer",
          "description": "Carbonated water with alcohol and flavoring",
          "type": "ALCOHOLIC"
        },
        {
          "id": 12,
          "name": "Ready-to-Drink Cocktails",
          "description": "Pre-mixed cocktails in cans or bottles",
          "type": "ALCOHOLIC"
        },
        {
          "id": 13,
          "name": "Vermouth",
          "description": "Aromatized fortified wine",
          "type": "ALCOHOLIC"
        },
        {
          "id": 14,
          "name": "Absinthe",
          "description": "Highly alcoholic anise-flavored spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 15,
          "name": "Aperitifs",
          "description": "Alcoholic drinks served before meals",
          "type": "ALCOHOLIC"
        },
        {
          "id": 16,
          "name": "Digestifs",
          "description": "Alcoholic drinks served after meals",
          "type": "ALCOHOLIC"
        },
        {
          "id": 17,
          "name": "Whiskey",
          "description": "Scotch, Bourbon, Rye, Irish whiskey",
          "type": "ALCOHOLIC"
        },
        {
          "id": 18,
          "name": "Vodka",
          "description": "Clear distilled spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 19,
          "name": "Rum",
          "description": "Light, dark, spiced, and aged rum",
          "type": "ALCOHOLIC"
        },
        {
          "id": 20,
          "name": "Gin",
          "description": "Juniper-flavored spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 21,
          "name": "Tequila",
          "description": "Blue agave-based spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 22,
          "name": "Brandy",
          "description": "Distilled wine spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 23,
          "name": "Cognac",
          "description": "Specific type of brandy from France",
          "type": "ALCOHOLIC"
        },
        {
          "id": 24,
          "name": "Mezcal",
          "description": "Smoky agave spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 25,
          "name": "Schnapps",
          "description": "Flavored spirits",
          "type": "ALCOHOLIC"
        },
        {
          "id": 26,
          "name": "Aquavit",
          "description": "Scandinavian caraway-flavored spirit",
          "type": "ALCOHOLIC"
        },
        {
          "id": 27,
          "name": "Coffee",
          "description": "Hot and cold coffee beverages",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 28,
          "name": "Tea",
          "description": "Various tea varieties and preparations",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 29,
          "name": "Juices",
          "description": "Fresh fruit and vegetable juices",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 30,
          "name": "Soft Drinks",
          "description": "Carbonated beverages and sodas",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 31,
          "name": "Smoothies",
          "description": "Blended fruit and yogurt drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 32,
          "name": "Water",
          "description": "Bottled, sparkling, and infused water",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 33,
          "name": "Milk & Dairy",
          "description": "Milk, milkshakes, and dairy-based drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 34,
          "name": "Plant-Based Milk",
          "description": "Almond, soy, oat, and other plant milks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 35,
          "name": "Energy Drinks",
          "description": "Beverages with stimulants and energy boosters",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 36,
          "name": "Sports Drinks",
          "description": "Electrolyte-replenishing beverages",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 37,
          "name": "Iced Tea",
          "description": "Chilled tea beverages",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 38,
          "name": "Lemonade",
          "description": "Sweetened lemon-based drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 39,
          "name": "Mocktails",
          "description": "Non-alcoholic mixed drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 40,
          "name": "Kombucha",
          "description": "Fermented tea beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 41,
          "name": "Kefir",
          "description": "Fermented milk drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 42,
          "name": "Hot Chocolate",
          "description": "Warm chocolate-based drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 43,
          "name": "Herbal Tea",
          "description": "Caffeine-free herbal infusions",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 44,
          "name": "Yerba Mate",
          "description": "South American caffeine-rich infused drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 45,
          "name": "Chai",
          "description": "Spiced tea beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 46,
          "name": "Coconut Water",
          "description": "Natural hydration drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 47,
          "name": "Sparkling Water",
          "description": "Carbonated water with natural flavors",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 48,
          "name": "Fruit Punch",
          "description": "Mixed fruit juice beverages",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 49,
          "name": "Horchata",
          "description": "Traditional rice-based drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 50,
          "name": "Bubble Tea",
          "description": "Tea-based drink with tapioca pearls",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 51,
          "name": "Ayran",
          "description": "Yogurt-based salty drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 52,
          "name": "Kvass",
          "description": "Traditional Slavic fermented beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 53,
          "name": "Switchel",
          "description": "Vinegar-based energy drink",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 54,
          "name": "Sharbat",
          "description": "Sweet Middle Eastern beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 55,
          "name": "Tonic Water",
          "description": "Carbonated water with quinine",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 56,
          "name": "Ginger Beer",
          "description": "Spicy non-alcoholic fermented beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 57,
          "name": "Root Beer",
          "description": "Sweet carbonated beverage",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 58,
          "name": "Club Soda",
          "description": "Carbonated water with minerals",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 59,
          "name": "Mineral Water",
          "description": "Naturally carbonated spring water",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 60,
          "name": "Flavored Water",
          "description": "Water with natural fruit flavors",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 61,
          "name": "Protein Shakes",
          "description": "Nutritional supplement drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 62,
          "name": "Vegetable Juice",
          "description": "Juices from various vegetables",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 63,
          "name": "Fusion Drinks",
          "description": "Mixed beverage combinations",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 64,
          "name": "Detox Drinks",
          "description": "Cleansing and health beverages",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 65,
          "name": "Wellness Shots",
          "description": "Small concentrated health drinks",
          "type": "NON_ALCOHOLIC"
        },
        {
          "id": 66,
          "name": "Cold Brew",
          "description": "Slow-steeped coffee concentrate",
          "type": "NON_ALCOHOLIC"
        }
      ];

for (const item of seed) {
    await prisma.beverageCategory.create({
        data: {
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type as BeverageCategoryType,
        }
    })

}
});


export default router;