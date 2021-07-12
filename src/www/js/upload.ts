import { Snackbar } from './snackbar.js'

// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
export const dropContainer = `
  <div id="drop-container">
    Drop Here
  </div>
  <!-- <input type="file" id="file-input" /> -->
`

export const dropContainerInit = () => {
  // const fileInput = document.getElementById('file-input') as HTMLInputElement
  // if (!fileInput) return

  const container = document.getElementById('drop-container')
  if (!container) return

  container.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault()

    if (!event?.dataTransfer?.files[0]) return

    for (let i = 0; i < event.dataTransfer.files.length - 1; i++) {
      const file = event.dataTransfer.files[i]
      const name = file.name

      const reader = new FileReader()
      reader.onload = async event => {
        if (event?.target?.result) {
          const result = await fetch('/upload', {
            // const result = await fetch('/secret/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, stack: event.target.result, secret: event.target.result })
          })
          const json = await result.json()
          const messages = json.msg.replace(/\n$/, '').split('\n')

          messages.forEach(m => {
            if (result.status === 200) new Snackbar(m)
            console.log('=> ', m)
          })

          if (result.status !== 200) new Snackbar(messages[messages.length - 1])
        }
      }

      reader.readAsText(file)
    }
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
  // --black: #0c0e14;
  // --white: #f8f8f2;

  const style = document.createElement('style')
  style.innerText = /* css */ `
  #drop-wrapper { position: fixed; top: 33%; left: 50%; transform: translate(-50%, -50%); z-index: 999; }
  #drop-container { font-size: 18px; color: #f8f8f2; background: #0c0e14e0; border-radius: 5px; width:200px; height:200px; border: 10px dashed #f8f8f2; text-align: center; vertical-align: middle; line-height: 200px; }
  #drop-container.over { background:#6272a4e0; }`
  document.body.prepend(style)

  const div = document.createElement('div')
  div.id = 'drop-wrapper'
  div.innerHTML = dropContainer
  document.body.prepend(div)

  dropContainerInit()
}

main()
