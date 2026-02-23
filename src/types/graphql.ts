export interface GraphQLError {
  message: string
}

export interface GraphQLResponse<TData> {
  data?: TData
  errors?: GraphQLError[]
}

export type HideoutProgressionQueryVariables = Record<string, never>

export interface HideoutProgressionQueryData {
  enStations: GqlHideoutStation[]
  koStations: GqlHideoutStation[]
}

export interface GqlHideoutStation {
  id: string
  name: string
  imageLink: string | null
  levels: GqlHideoutStationLevel[]
}

export interface GqlHideoutStationLevel {
  id: string
  level: number
  constructionTime: number
  description: string
  itemRequirements: GqlRequirementItem[]
  stationLevelRequirements: GqlRequirementStationLevel[]
  traderRequirements: GqlRequirementTrader[]
}

export interface GqlRequirementItem {
  count: number
  item: GqlItem
  attributes: GqlRequirementAttribute[]
}

export interface GqlRequirementAttribute {
  name: string | null
  value: string | null
}

export interface GqlRequirementStationLevel {
  level: number
  station: {
    id: string
    name: string
  }
}

export interface GqlRequirementTrader {
  value: number | null
  trader: {
    id: string
    name: string
  }
}

export interface GqlItem {
  id: string
  name: string | null
  shortName: string | null
  iconLink: string | null
}
