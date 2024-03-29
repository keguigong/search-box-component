import Head from "next/head"
import { useEffect, useMemo, useRef, useState } from "react"

import styles from "./home.module.scss"
import { controller, getSearchResult, Result, throttled } from "@/api/search"
import { Search, ResultList, Footer, TagList } from "@/components"

export default function Home() {
  const [activeTag, setTag] = useState("")
  /**
   * Two errors should be stored. error[0] represents search-input and footer status,
   * error[1] represents error picture, when a new requst is going to be made, restore
   * the error[0] instead of both error[0] and error[1]
   */
  const [error, setError] = useState([false, false])
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Result[]>([])
  // For footer
  const len = useMemo(() => list.length, [list])
  /**
   * Prevent update state when activeTag was cleared
   * When false, setList/setError/setLoading cannot be called
   */
  const setterFlag = useRef(true)

  const request = useMemo(() => {
    const getResults = (_activeTag: string) => {
      if (setterFlag.current === false) return
      setLoading(true)
      /**
       * Restore the error state of both input and footer
       * Keep the error[1] cause we don't want the picture flushes when making requests.
       */
      setError((error) => [false, error[1]])
      getSearchResult(_activeTag).then((res) => {
        if (setterFlag.current === false) return
        if (res instanceof Error) setError([true, true]), setList([])
        /**
         * Remember to restore both errors when made successful requests
         */ else setList(res), setError([false, false])
        setLoading(false)
      })
    }
    const throttle = throttled(getResults)
    return throttle
  }, [])

  useEffect(() => {
    /**
     * Make request when activeTag changes.
     * Restore state when activeTag is empty.
     */
    if (activeTag) {
      setterFlag.current = true
      request(1000, activeTag)
    } else {
      controller?.abort()
      setterFlag.current = false
      Promise.resolve().then(() => {
        setList([]), setLoading(false), setError([false, false])
      })
    }

    return () => {
      controller?.abort()
    }
  }, [activeTag, request])

  return (
    <>
      <Head>
        <title>Building a Search Box Component</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className={styles.section}>
        <div className={styles.searchComponent}>
          <div className={styles.upper}>
            <Search
              error={error[0]}
              value={activeTag}
              onChange={(e) => setTag(e)}
              onSearch={(e) => (setTag(e), request(0, activeTag))}
            ></Search>
            <TagList activeTag={activeTag} onClick={(e) => setTag(e)}></TagList>
          </div>
          <ResultList error={error[1]} loading={loading} list={list}></ResultList>
          <Footer error={error[0]} loading={loading} len={len}></Footer>
        </div>
      </section>
    </>
  )
}
