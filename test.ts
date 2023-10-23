/// CORE ///

/**
 * Extracts the name of an input
 */
type InputName<T> = T extends Input<infer Name, any> ? Name : never

/**
 * Extracts the type of an input
 */
type InputType<T> = T extends Input<any, infer Type> ? Types[Type] : never

/**
 * Extracts the outputs of an array of inputs
 */
type Outputs<Inputs extends readonly Input<any, TypeName>[]> = {
  [K in InputName<Inputs[number]>]: InputType<
    Extract<Inputs[number], { name: K }>
  >
}

/**
 * Represent the type name of an input
 */
type TypeName = keyof Types

/// SETTINGS ///

/**
 * Example types
 */
interface Types {
  boolean: boolean
  number: number
  string: string
}

/// EXAMPLES ///

/**
 * Example input
 */
interface Input<Name extends string, Type extends TypeName> {
  readonly name: Name
  readonly type: Type
}

/**
 * Example class
 */
class Example<const Inputs extends readonly Input<any, TypeName>[]> {
  constructor(
    public inputs: Inputs,
    public run: (outputs: Outputs<Inputs>) => void
  ) {}

  compute(raw: string) {
    const outputs: Outputs<Inputs> = {} as any
    const rawInputs = raw.split(/\s+/)

    for (const input of this.inputs) {
      const rawInput = rawInputs.shift()

      if (!rawInput) throw new Error(`Missing input ${input.name}`)

      // @ts-expect-error
      outputs[input.name] = this.convert(rawInput, input.type)
    }

    this.run(outputs)
  }

  convert<T extends keyof Types>(raw: string, type: T): Types[T] {
    return (
      type === "string" ? raw : type === "number" ? Number(raw) : Boolean(raw)
    ) as Types[T]
  }
}

/// TESTS ///

const example = new Example(
  [
    { name: "name", type: "string" },
    { name: "age", type: "number" },
    { name: "isMajor", type: "boolean" },
  ],
  (outputs) => {
    outputs.name //                 => string (John)
    outputs.age //                  => number (42)
    outputs.isMajor //              => boolean (true)
  }
)

example.compute("John 42 true") //  => OK
example.compute("John 42") //       => Error: Missing input isMajor
