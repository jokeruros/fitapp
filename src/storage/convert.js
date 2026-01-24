import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

// CONFIG
const INPUT_FILE = 'C:\\Users\\urosjokic\\Desktop\\FITApp\\fitness-pwa\\src\\storage\\systemFoods.json'
const OUTPUT_FILE = 'C:\\Users\\urosjokic\\Desktop\\FITApp\\fitness-pwa\\src\\storage\\insert-system-foods.sql'

// Load JSON
const raw = readFileSync(INPUT_FILE, 'utf-8')
const json = JSON.parse(raw)

if (!json.namirnice || !Array.isArray(json.namirnice)) {
  console.error('Invalid JSON format. Missing "namirnice" array.')
  process.exit(1)
}

// Escape single quotes for SQL
function escapeSQL(str) {
  return str.replace(/'/g, "''")
}

const values = json.namirnice.map(item => {
  const name = escapeSQL(item.naziv.trim())
  const grams = Number(item.kolicina) || 100
  const protein = Number(item.proteini) || 0
  const carbs = Number(item.hidrati) || 0
  const fats = Number(item.masti) || 0
  const calories = Number(item.kalorije) || 0

  return `('${name}', ${grams}, ${protein}, ${carbs}, ${fats}, ${calories}, true)`
})

const sql = `
insert into foods (name, grams, protein, carbs, fats, calories, is_system)
values
${values.join(',\n')};
`

writeFileSync(OUTPUT_FILE, sql)

console.log(`SQL file generated: ${OUTPUT_FILE}`)
console.log(`Inserted rows: ${values.length}`)
