// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
export const dropContainer = `
<div>
  <div id="drop-container">
    Drop Here
  </div>
  <!-- <input type="file" id="file-input" /> -->
</div>
`

export const dropContainerInit = () => {
  // const fileInput = document.getElementById('file-input') as HTMLInputElement
  // if (!fileInput) return

  const container = document.getElementById('drop-container')
  if (!container) return

  container.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault()

    const file = event?.dataTransfer?.files[0]
    if (!file) return

    const name = file.name

    if (event && event.dataTransfer && event.dataTransfer.files.length > 1) {
      console.warn('Only one file at the time please.')
      return
    }

    // fileInput.files = event.dataTransfer.files
    // const name = fileInput.files[0].name

    const reader = new FileReader()
    reader.onload = async event => {
      if (event?.target?.result) {
        // const result = await fetch('/stack/deploy', {
        const result = await fetch('/secret/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, stack: event.target.result })
        })
        const json = await result.json()
        console.log('RESULT:')
        json.msg
          .replace(/\n$/, '')
          .split('\n')
          .forEach(m => console.log('=> ', m))
      }
    }

    reader.readAsText(file)
  })

  container.addEventListener('dragover', (event: DragEvent) => {
    event.preventDefault()
  })
  container.addEventListener('dragenter', (event: DragEvent) => {
    event.preventDefault()
    container.classList.toggle('over')
  })
  container.addEventListener('dragleave', (event: DragEvent) => {
    event.preventDefault()
    container.classList.toggle('over')
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
