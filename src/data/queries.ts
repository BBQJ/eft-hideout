import type {
  HideoutProgressionQueryData,
  HideoutProgressionQueryVariables,
} from '../types/graphql'

export interface TypedQuery<TVariables extends Record<string, unknown>> {
  key: string
  query: string
  defaultVariables: TVariables
}

export const HIDEOUT_PROGRESSION_QUERY: TypedQuery<HideoutProgressionQueryVariables> = {
  key: 'hideout-progression-v5',
  defaultVariables: {},
  query: `
query HideoutProgression {
  enStations: hideoutStations(lang: en) {
    id
    name
    imageLink
    levels {
      id
      level
      constructionTime
      description
      itemRequirements {
        count
        attributes {
          name
          value
        }
        item {
          id
          name
          shortName
          iconLink
        }
      }
      stationLevelRequirements {
        level
        station {
          id
          name
        }
      }
      traderRequirements {
        value
        trader {
          id
          name
        }
      }
    }
  }
  koStations: hideoutStations(lang: ko) {
    id
    name
    imageLink
    levels {
      id
      level
      constructionTime
      description
      itemRequirements {
        count
        attributes {
          name
          value
        }
        item {
          id
          name
          shortName
          iconLink
        }
      }
      stationLevelRequirements {
        level
        station {
          id
          name
        }
      }
      traderRequirements {
        value
        trader {
          id
          name
        }
      }
    }
  }
}
`,
} as const

export type HideoutProgressionData = HideoutProgressionQueryData
