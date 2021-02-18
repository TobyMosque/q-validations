import { VueConstructor } from 'vue'
import { getCurrentInstance, reactive } from '@vue/composition-api'

type RuleFn = (val: any) => boolean | string;
type RuleName = 'required' | 'email' | 'compare'
type Args<T> = Partial<Record<RuleName, T>>
type ArgNames<T> = (keyof Args<T>)[]
type RequestArgs<T extends string> = Record<T, Args<any> | ArgNames<any>>

class ArgData {
  enabled = true;
  [key: string]: any;
}

class Validation<T extends string> {
  rules!: Partial<Record<T, RuleFn[]>>;
  args!: Partial<Record<T, Args<ArgData>>>;
}

const fns : Record<RuleName, (vm: InstanceType<VueConstructor> | null, field: string, args: any) => ({ fn: RuleFn, args: ArgData })> = {
  required (vm, field, args) {
    const _args = reactive({ enabled: true } as ArgData)
    return {
      fn: function required (val: any) : boolean | string {
        return !_args.enabled || !!val || vm?.$t('validations.required', {
          field: vm?.$t(`fields.${field}`)
        }) as string
      },
      args: _args
    }
  },
  email (vm, field, args) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const _args = reactive({ enabled: true } as ArgData)
    return {
      fn: function email (val: any) : boolean | string {
        return !_args.enabled || emailRegex.test(val) || vm?.$t('validations.email', {
          field: vm?.$t(`fields.${field}`)
        }) as string
      },
      args: _args
    }
  },
  compare (vm, field, args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const _args = reactive({ enabled: true, other: args } as ArgData)
    return {
      fn: function compare (val: any) : boolean | string {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return !_args.enabled || val === (vm as any)[_args.other] || vm?.$t('validations.compare', {
          field: vm?.$t(`fields.${field}`),
          other: vm?.$t(`fields.${_args.other as string}`)
        }) as string
      },
      args: _args
    }
  }
}

function generate<T extends string> (args: RequestArgs<T>, vm?: InstanceType<VueConstructor>) : Validation<T> {
  if (vm === undefined) {
    vm = getCurrentInstance() as InstanceType<VueConstructor>
  }

  const vRules : Partial<Record<T, RuleFn[]>> = {}
  const vArgs : Partial<Record<T, Args<ArgData>>> = {}
  for (const key in args) {
    const arg = args[key]
    const isArray = Array.isArray(arg)
    const ruleNames : ArgNames<ArgData> = isArray ? arg as ArgNames<ArgData> : Object.keys(arg) as ArgNames<ArgData>
    const pRules : RuleFn[] = []
    const pArgs : Args<ArgData> = {}
    for (const ruleName of ruleNames) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = isArray ? null : (arg as Args<ArgData>)[ruleName]
      const result = fns[ruleName](vm, key, payload)
      pRules.push(result.fn)
      if (result.args) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        pArgs[ruleName] = result.args
      }
    }
    vRules[key] = pRules
    const hasArgs = Object.keys(pArgs).length > 0
    if (hasArgs) {
      vArgs[key] = pArgs
    }
  }
  const validation = new Validation<T>()
  validation.rules = vRules
  validation.args = vArgs
  return validation
}

export default generate
