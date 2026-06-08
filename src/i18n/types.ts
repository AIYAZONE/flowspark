import type en from './en.json'

export type Dictionary = typeof en
export type TodayDictionary = Dictionary['today']
export type GoalNewDictionary = Dictionary['goals']['new']
export type CommonErrorDictionary = Dictionary['common']['errors']
