import { syntaxTree } from '@codemirror/language'
import { RangeSet, StateField } from '@codemirror/state'
import { Decoration, DecorationSet, EditorView } from '@codemirror/view'
import type { EditorState, Extension, Range } from '@codemirror/state'
import type { WidgetType } from '@codemirror/view'

interface ReferenceWidget extends WidgetType {
  compare: (widget: ReferenceWidget) => boolean
  text: string
}

const referenceWidget = (text: string): ReferenceWidget => {
  return {
    compare: (other: ReferenceWidget) => {
      return other.text === text
    },
    destroy: () => {},
    eq: (other: ReferenceWidget) => {
      return other.text === text
    },
    estimatedHeight: -1,
    ignoreEvent: () => true,
    text: text,
    toDOM: () => {
      const span = document.createElement('span')

      span.innerText = text

      return span
    },
    updateDOM: () => false,
  }
}

const hasOverlap = (x1: number, x2: number, y1: number, y2: number) => {
  return Math.max(x1, y1) <= Math.min(x2, y2)
}

const isCursorInRange = (state: EditorState, from: number, to: number) => {
  return state.selection.ranges.some((range) => {
    return hasOverlap(from, to, range.from, range.to)
  })
}

export const references = (): Extension => {
  const referenceDecoration = (text: string) => Decoration.replace({
    widget: referenceWidget(text),
  })

  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = []

    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name === 'Reference') {
          const text = 'TESTING'

          // Do not run on empty references
          if (from + 2 === to - 2) { return }

          if (text && !isCursorInRange(state, from + 2, to - 2)) {
            widgets.push(referenceDecoration(text).range(from + 2, to - 2))
          }
        }
      },
    })

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none
  }

  const stateField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state)
    },
    update(_references, { state }) {
      return decorate(state)
    },
    provide(field) {
      return EditorView.decorations.from(field)
    },
  })

  return [
    stateField,
  ]
}
