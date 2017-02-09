###How to Run:
```sh
git clone git@github.com:marolt/ng2-chart-example.git
cd ng2-chart-example
yarn
yarn start
```

Use `yarn (or npm) start` for dev server. Default dev port is `3000`.

Application is served on `ip:3000` (host is `0.0.0.0`)



###Issue
I'm having problem with creating custom `ngx-charts` graph.
It always throws `ZoneAwareError` `Cannot read property 'run' of undefined`. I assume
that the problem here is build setup, or did I forgot to import something?