importScripts('./node_modules/spark-md5/spark-md5.min.js')

// 文件处理相关函数
const fileHandler = {
    createChunk(file, chunkSize = 2 * 1024 * 1024) {
        const result = []
        let start = 0
        while (start < file.size) {
            // 确保最后一片也能被完整切下来
            const end = Math.min(start + chunkSize, file.size);
            result.push(file.slice(start, end));
            start = end;
        }
        return result
    },

    calculateHash(chunks) {
        return new Promise((resolve) => {
            const spark = new SparkMD5.ArrayBuffer()
            function _read(index) {
                if (index >= chunks.length) {
                    resolve(spark.end())
                    return
                }
                const reader = new FileReader()
                reader.onload = (e) => {
                    spark.append(e.target.result)
                    _read(index + 1)
                }
                reader.readAsArrayBuffer(chunks[index])
            }
            _read(0)
        })
    }
}
async function handleUpload(state) {
    if (!state.chunks) {
        state.chunks = await fileHandler.createChunk(state.file)
    }
    if (!state.fileHash) {
        state.fileHash = await fileHandler.calculateHash(state.chunks)
    }
    postMessage({ state })
}
onmessage = async function (event) {
    await handleUpload(event.data.state)
}

