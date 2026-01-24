import { supabase } from '../lib/supabase'
import type { Food } from './models'

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

/* ------------------ GET FOODS ------------------ */

export async function getFoods(): Promise<Food[]> {
  const userId = await getUserId()
  // console.log('userId: ', userId, `user_id.eq.${userId},is_system.eq.true`) 
  const { data:userData, error:userDataError } = await supabase
    .from('foods')
    .select('*').eq('user_id', userId)

  if (userDataError) throw userDataError
  // console.log('User foods data: ', userData)
  


    const { data:systemData, error:systemDataError } = await supabase
    .from('foods')
    .select('*').eq('is_system', true)

  if (systemDataError) throw systemDataError
  // console.log('System foods data: ', systemData)
  const data = [...(userData || []), ...(systemData || [])]

  const foods: Food[] =
    data?.map(f => ({
      id: f.id,
      name: f.name,
      protein: Number(f.protein),
      carbs: Number(f.carbs),
      fats: Number(f.fats),
      calories: Number(f.calories),
      grams: Number(f.grams),
      user: !f.is_system
    })) ?? []

  // user foods first
  const userFoods = foods.filter(f => f.user)
  // console.log('User foods: ', userFoods, userId)
  const systemFoods = foods.filter(f => !f.user)

  return [...userFoods, ...systemFoods]
}

/* ------------------ Get Food  ------------------ */
export async function getFood(food: Food): Promise<{id: string, name: string} | null> {
 const userId = await getUserId()
 const { data, error } = await supabase.from('foods').select('*').eq('id', food.id).eq('user_id', userId)
  if (error) throw error  
  // console.log('Fetched food data: ', data)
  return data.length > 0 ? {
    id: data[0].id,
    name: data[0].name
  } : null
}
/* ------------------ ADD FOOD ------------------ */

export async function addFood(food: Food) {
  const userId = await getUserId()

  const { error } = await supabase.from('foods').insert({
    id: food.id,
    user_id: userId,
    name: food.name,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    calories: food.calories,
    grams: food.grams,
    is_system: false
  })

  if (error) throw error
  // console.log('Food added: ', food)
}

/* ------------------ UPDATE FOOD ------------------ */

export async function updateFood(food: Food) {
  const { error } = await supabase
    .from('foods')
    .update({
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      calories: food.calories,
      grams: food.grams
    })
    .eq('id', food.id)
    .eq('is_system', false) // prevent editing system foods

  if (error) throw error
  //console.log('Food updated: ', food)
}
/* ------------------ DELETE FOOD ------------------ */

export async function deleteFood(id: string) {
  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', id)
    .eq('is_system', false) // prevent deleting system foods

  if (error) throw error
  // console.log('Food deleted: ', id)
}
