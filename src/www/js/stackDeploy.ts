// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
export const dropContainer = `
<div>
<div id="drop-container">
    Drop Here
</div>

 <input type="file" id="file-input" />


</div>
`

export const dropContainerInit = () => {
  const fileInput = document.getElementById('file-input') as HTMLInputElement
  if (!fileInput) return

  const container = document.getElementById('drop-container')
  if (!container) return

  container.addEventListener('drop', (event: DragEvent) => {
    if (event.dataTransfer.files.length > 1) {
      console.warn('Only one file at the time please.')
      return
    }

    // fileInput.files = event.dataTransfer.files

    const reader = new FileReader()
    reader.onload = event => {
      console.log(event.target.result)
    }
    reader.readAsText(event.dataTransfer.files[0])

    event.preventDefault()
  })

  container.addEventListener('dragover', (event: DragEvent) => {
    event.preventDefault()
  })
  container.addEventListener('dragenter', (event: DragEvent) => {
    container.classList.toggle('over')
    event.preventDefault()
  })
  container.addEventListener('dragleave', (event: DragEvent) => {
    container.classList.toggle('over')
    event.preventDefault()
  })
}

const main = () => {
  const style = document.createElement('style')
  style.innerText = /* css */ `
  #drop-container { width:200px; height:200px; border: 10px dashed #ccc; }
  #drop-container.over { background-color:red; }`
  document.body.prepend(style)

  const div = document.createElement('div')
  div.innerHTML = dropContainer
  document.body.prepend(div)

  dropContainerInit()
}

main()
