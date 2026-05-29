type RuntimeNode = {
  runtime: string

  status: string
}

class IntelligenceMesh {
  private nodes:
    RuntimeNode[] = []

  connect(node: RuntimeNode) {
    this.nodes.push(node)
  }

  topology() {
    return this.nodes
  }
}

export const intelligenceMesh =
  new IntelligenceMesh()
