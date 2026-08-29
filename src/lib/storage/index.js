// Wählt beim Laden das Storage-Backend: Supabase, wenn konfiguriert
// (Geräte-Sync), sonst lokaler Browser-Speicher. Beide bieten dieselbe
// async-API, damit der Rest der App nicht wissen muss, welches aktiv ist.
import { isCloudConfigured } from '../config'
import * as local from './local'
import * as cloud from './cloud'

const backend = isCloudConfigured ? cloud : local

export const isCloud = isCloudConfigured
export const listRecipes = backend.listRecipes
export const getRecipe = backend.getRecipe
export const saveRecipe = backend.saveRecipe
export const deleteRecipe = backend.deleteRecipe
export const uploadImage = backend.uploadImage
export const listPlanner = backend.listPlanner
export const addToPlanner = backend.addToPlanner
export const setPlannerPortions = backend.setPlannerPortions
export const removeFromPlanner = backend.removeFromPlanner
export const clearPlanner = backend.clearPlanner
export const uploadInboxImage = backend.uploadInboxImage
export const listInbox = backend.listInbox
export const addInboxPhoto = backend.addInboxPhoto
export const updateInboxPhoto = backend.updateInboxPhoto
export const deleteInboxPhoto = backend.deleteInboxPhoto
