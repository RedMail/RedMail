import dns from 'native-dns'

export default (mx) => {
  const req = dns.Request({
    question: dns.Question({
      name: mx,
      type: 'MX',
    }),
    server: {
      address: '114.114.114.114',
      port: 53,
      type: 'udp'
    },
    timeout: 1000,
  })

  req.on('timeout', () => console.log('DNS Timeout 超时'))
  req.on('end', () => {})
  req.send()

  return new Promise((resolve, reject) => {
    req.on('message', (err, answer) => {
      const list = []
      answer.answer.forEach((a) => list.push(a.exchange))
      resolve(list)
    })
  })
}
