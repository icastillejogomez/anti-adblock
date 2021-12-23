// Blacklist import
import { DEFAULT_BLACKLIST_URL, getRandomUrl } from './blacklist'

interface AntiAdblockConfig {
  debug?: boolean,
  config?: {
    initTimeout?: number,
    classNameMethodTimeout?: number,
    useRandomFetchUrlFromBlacklist?: boolean,
    customFetchUrl?: URL,
  },
}

class AntiAdblock  {

  // Declare attributes
  private ready = false
  private debug: boolean
  private config: AntiAdblockConfig['config']

  constructor(config: AntiAdblockConfig) {
    // Save props and config
    this.debug = config.debug ?? false
    this.config = config.config
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.debug) console.debug('Initializing AntiAdblock')
      if (typeof window === 'undefined' || typeof document === 'undefined') throw new Error('This module only runs in the browser.')
      if (this.debug) console.debug('Wating to DOMContentLoaded event')
      let resolved = false
      window.addEventListener('DOMContentLoaded', () => {
        resolved = true
        this.ready = true
        resolve()
      })
      if (document.readyState === 'complete') {
        resolved = true
        this.ready = true
        resolve()
      }
      setTimeout(() => {
        if (!resolved) reject(new Error('AntiAdblock init max timeout reached'))
      }, this.config?.initTimeout ?? 1000 * 10) // 10s
    })
  }

  private checkReadyState() {
    if (!this.ready) throw new Error('AntiAdblock is not ready')
  }

  async check(): Promise<boolean> {
    this.checkReadyState()
    if (await this.classNameCheck()) return true
    if (await this.requestCheck()) return true
    return false
  }

  classNameCheck(): Promise<boolean> {
    this.checkReadyState()
    return new Promise((resolve) => {
      let isAdBlockPresent = false
      const adHtmlTag = document.createElement('div')
      adHtmlTag.innerHTML = '&nbsp;'
      adHtmlTag.className = 'adsbox'
      const $adElement = document.body.appendChild(adHtmlTag)
      setTimeout(() => {
        isAdBlockPresent = $adElement.offsetHeight === 0
        resolve(isAdBlockPresent)
      }, this.config?.classNameMethodTimeout ?? 100)
    })
  }

  requestCheck(): Promise<boolean> {
    this.checkReadyState()
    return new Promise((resolve) => {
      // Prepare URL
      const url: URL = this.config?.customFetchUrl !== undefined
        ? this.config?.customFetchUrl
        : this.config?.useRandomFetchUrlFromBlacklist
          ? getRandomUrl()
          : DEFAULT_BLACKLIST_URL
      
      // Make request
      fetch(url.toString(), { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
        .then(() => {
          resolve(false)
        })
        .catch((error) => {
          if (this.debug) console.debug(`Error making request to ${url.toString()}`, error)
          resolve(true)
        })
    })
  }

}

export default AntiAdblock
