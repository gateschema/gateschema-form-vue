export function createMockStateForm(render) {
  return  {
    props: ['state'],
    methods: {
      emitUserInput(path, value, index) {
        this.$emit('input', path, value, index)
      },
      emitSubmit() {
        this.$emit('submit')
      }
    },
    render
  }
}