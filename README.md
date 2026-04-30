# Cat Tower Defense

## Overview

Cat Tower Defense is a browser-based tower defense game where the player places different types of cats to stop waves of enemies. The game focuses on positioning, upgrades, and strategic decision-making.

---

## Gameplay

* Click on the map to place a selected cat
* Click a cat to open its menu (upgrade / sell)
* Use keys **1–9** to select cat types
* Enemies arrive in waves
* Every **3 waves**, the map changes
* Boss enemies appear and introduce new mechanics

---

## Units (Cats)

Each cat has:

* Damage
* Range
* Attack cooldown
* Level (max 5)
* Experience (XP)

Restrictions:

* Maximum **3 units per type**

---

## Leveling System

* Cats gain XP when attacking or killing enemies
* Leveling increases stats
* Upgrades are done through the unit menu

---

## Mutations

* 25% chance when a cat is placed
* Provides random buffs (damage, range, speed)
* Visible in the unit menu

---

## Elemental Cats

Unlocked by defeating bosses:

* **Ice Sentinel** – slows enemies
* **Water Medic** – heals nearby cats
* **Grass Sage** – shields nearby cats
* **Fire Lynx** – deals cone damage

Cost:

* 1500 money

---

## Boss System

* Multiple boss types with different behaviors
* On defeat:

  * 25% chance to unlock an elemental cat

---

## Economy

* Earn money by killing enemies
* Spend money on:

  * Placing units
  * Upgrading units

---

## Combat System

* Improved projectile collision system
* Target prioritization
* Supports different attack types:

  * Single target
  * Area damage
  * Cone attacks

---

## Additional Features

* Sell system for removing units
* Start and Game Over screens with visuals
* Dynamic map rotation
* Sound system using Web Audio API

---

## Controls

| Action           | Input         |
| ---------------- | ------------- |
| Place unit       | Mouse click   |
| Select unit type | Keys 1–9      |
| Open unit menu   | Click on unit |
| Pause            | Button        |

---

## End Conditions

* **Game Over**: enemies reach the base
* **Victory**: all waves cleared

---

## Technologies Used

* HTML5 Canvas
* JavaScript (Vanilla)
* CSS
* Web Audio API

---

## Project Structure

```text
index.html
style.css
script.js
assets/
```

---

## Future Improvements

* More enemy types with resistances
* Advanced targeting logic
* Better scaling system
* Additional maps and mechanics

---

## Author

Project created as a custom tower defense game implementation.
