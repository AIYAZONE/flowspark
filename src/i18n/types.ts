import type en from './en.json'

export type Dictionary = typeof en
export type TodayDictionary = Dictionary['today']
export type GoalNewDictionary = Dictionary['goals']['new']
export type CommonErrorDictionary = Dictionary['common']['errors']
export type DashboardDictionary = Dictionary['dashboard']
export type DashboardPlanningDictionary = Dictionary['dashboard']['planning']
