export class Snackbar {
  constructor(message: string) {
    const snacks = document.getElementById('snacks')
    if (!snacks) return

    const snackbar = document.createElement('div')
    snackbar.classList.add('snack')
    snackbar.innerText = message
    snacks.appendChild(snackbar)

    setTimeout(() => snackbar.remove(), 5000)
  }
}
