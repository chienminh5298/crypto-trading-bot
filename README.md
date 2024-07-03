# Crypto-trading-bot

This is an automated cryptocurrency trading bot. The system will automatically allocate budget to each strategy you set. The system will automatically set stop loss and take profit based on what you have configured.

## Database - MySQL - ORM Prisma

### Table Token

```
model Token {
  id                Int         @id @default(autoincrement())
  name              String
  stable            String
  precision         Float
  isActive          Boolean     @default(true)
  tokenDatas        TokenData[]
  rootOrders        RootOrder[]
  targets           Target[]
  tokenStrategies   TokenStrategy[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

-   **name**: Token name [Example: ETH, BTC, BNB, ...]
-   **stable**: Stable coin [Example: USDT, USDC, ...]
-   **precision**: Floating point qty value by Binance [Example with BTC/USDT qty amount 2.32 => presicion is 2, with ETH/USDT qty amount 3.333 => presicion is 3]
-   **isActive**: If true token will be traded

### Table Strategy

```
model Strategy {
  id                Int      @id @default(autoincrement())
  description       String
  contribution      Int      @default(0)
  tokenStrategies   TokenStrategy[]
  targets           Target[]
  rootOrder         RootOrder[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

-   **contribution**: The budget allocation percentages for each strategy. [Example: Our account budget is 1000$, contribution value is 50% => 500$ will be used for this strategy and we have 2 tokens use this strategy => budget for each order per token will 250$]. WARNING: sum of contribution of all strategies should less or equal 100%.

### Table Target

```
model Target {
  id            Int       @id @default(autoincrement())
  percent       Float
  stopLosses    StopLoss[]
  rootOrder     RootOrder[]
  tokenId       Int?
  token         Token?    @relation(fields: [tokenId], references: [id])
  strategyId    Int?
  strategy      Strategy? @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

A strategy has multiple targets for every single token.

-   **percent**: This is the percentage of profit that an order needs to achieve. Based on each level of percent, we can move the stop loss or make a decision to take profit. Example:
    -   If percent = 0, it means place the stoploss immediately after order is created.
    -   If percent = 3, it means when order has profit 3% from entry price, we can move up stoploss or close order to take profit.

### Table Stoploss

```
model StopLoss {
  id          Int      @id @default(autoincrement())
  percent     Float
  qtyPercent  Float
  targetId    Int?
  target      Target?  @relation(fields: [targetId], references: [id], onDelete: SetNull)
  subOrders   SubOrder[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

A target has multiple stoplosses.

-   **percent**: Percent when we set stoploss calculate from entry price. Example:
    -   If a BUY order with entry price is 100$ and percent is -5% => stoploss has mark price at 95$.
    -   If a BUY order with entry price is 100$ and percent is 3% => stoploss has mark price at 103$.
    -   If a SELL order with entry price is 100$ and percent is -5% => stoploss has mark price at 105$.
    -   If a SELL order with entry price is 100$ and percent is 3% => stoploss has mark price at 97$.
-   **qtyPercent**: Percent of qty will use for stoploss. [Example: Qty of order is 10 coins and qtyPercent is 0.3, it means this stoploss will use 3 coins].

### Table TokenData

```
model TokenData {
  id            Int       @id @default(autoincrement())
  open          Float
  close         Float
  high          Float
  low           Float
  volume        Float
  indicators    String
  tokenId       Int?
  token         Token?   @relation(fields: [tokenId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Table use for record history data of tokens.

### Table RootOrder

```
model RootOrder {
  id                Int      @id @default(autoincrement())
  orderId           String   @unique
  side              Side
  timestamp         String
  entryPrice        Float
  qty               Float
  budget            Float
  status            Status  @default(ACTIVE)
  profit            Float?
  markPrice         Float?
  subOrders         SubOrder[]
  strategyId        Int
  strategy          Strategy? @relation(fields: [strategyId], references: [id])
  currentTargetId   Int?
  target            Target? @relation(fields: [currentTargetId], references: [id], onDelete: SetNull)
  tokenId           Int?
  token             Token?   @relation(fields: [tokenId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

-   **orderId**: This unique number returned from Binance
-   **side**: BUY or SELL
-   **timestamp**: Unique time at moment place order returned from Binance
-   **budget**: Budget use for this order.
-   **status**:
    -   ACTIVE: Order is running.
    -   EXPIRED: Order is cancelled.
    -   FINISHED: Order executed.
-   **profit**: Profit of order updated if order FINISHED.
-   **markPrice**: The price when order FINISHED.
-   **currentTargetId**: Id of target which order need reachs.

### Table SubOrder

```
model SubOrder {
  id          Int       @id @default(autoincrement())
  orderId     String    @unique
  side        Side
  markPrice   Float
  timestamp   String
  qty         Float
  budget      Float
  status      Status    @default(ACTIVE)
  profit      Float?
  stopLossId  Int?
  stopLosses  StopLoss? @relation(fields: [stopLossId], references: [id])
  rootOrderId Int?
  rootOrder   RootOrder? @relation(fields: [rootOrderId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

A RootOrder can has multiple subOrder. EACH SUBORDER REPRESENTS A STOPLOSS.

-   **orderId**: Unique Id returned from Binance.
-   **side**: Side of subOrder always counter side of rootOrder.
-   **markPrice**: the price when subOrder FINISHED.
-   **budget**: Budget for this subOrder.
-   **profit**: Profit of subOrder updated if order FINISHED.
-   **rootOrderId**: Id of rootorder which this subOrder belongs to.

### Table TokenStrategy

```
model TokenStrategy {
  id            Int       @id @default(autoincrement())
  tokenId       Int?
  token         Token?    @relation(fields: [tokenId], references: [id])
  strategyId    Int?
  strategy      Strategy? @relation(fields: [strategyId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Connection table between Token and Strategy (Relationship Many-Many)

# Instruction

## Step 1:

Setup database, replace username, password and database name with your own information in prisma/schema.prisma file.

```
datasource db {
  provider = "mysql"
  url      = "mysql://[username]:[password]@localhost:3306/[dbName]"
}
```

-   After create schema, open terminal and run "npx prisma migrate dev --schema=./prisma/schema.prisma" to initial schema table.
-   Import sql file from database/example.sql to schema.

## Step 2:

Fill data in .env file

```
# Server setting
SERVER_PORT = 1234

# API setting
BINANCE_APIKEY = ''
BINANCE_SECRETKEY = ''
INDICATOR_KEY = '' # TAAPI.com api key

# Account setting
ACC_BUDGET = 0 # Account budget
```

## Step 3:

This instruction use EMA 13 and EMA 20 as example.

-   Read taapi.com document to change src/payload/indicator.ts file with your indicator.
-   Change file src/api/indicator.ts with your indicator.

## Step 4: Strategy

This instruction has 1 strategy use EMA 13 and EMA 20 for example

- If you want create your own strategy you should create a new strategy file depend on src/strategies/strategy1.ts file
- Create a record MySQL in Table Strategy. 
- Strategy file should return an object like

```
 {
    strategyId: [This is id of record in strategy table],
    side: ['SELL' or 'BUY'],
};
```

- Create target which belongs to strategy in Table Target. A strategy has multiple targets, a target is a percent milestone that order should reach.
- Create stoploss which belongs to target in Table Stoploss. A target has multiple stoplosses.
- Change "isActive" attribute of tokens which you want to trade in Table Token.
- Add record your token which you want apply strategy for it into Table TokenStrategy.

## Step 5:
- Access your binance.com, in API management add IP address this machine into "Restrict access to trusted IPs only"
![API management](./instruction/api_management.png)

- Change trade mode to Isolate and 1x

![API management](./instruction/screenshot.png)

## Step 6:
- Open terminal install package by using "npm install"
- To run system using "npm start" and this how it look like when it run successfully. 
```
[INFO]: Connect database successful. ✓
[INFO]: Get listen key successful. ✓
[INFO]: Get timestamp successful. ✓
[INFO]: Binance socket open successfuly. ✓
```

## Warning:
- This system will trade on Binance.com so make sure your IP address of computer which run this code available with Binance.com (If you are American, you have to use VPN to somewhere can access Binance.com).
- If you deploy on EC2 AWS you can choose Singapore region.
- If has some error, check log in log/ folder, and recheck your IP address. Most case the IP address not in white list of API management of your Binance account.
- This system trade daily, if you want to change it to 5 mins, 10 mins or something else you can change at ./setting.ts
- Because it trade daily so system will run check your strategy at 0:03 AM every day. You can change at line 66 ./index.ts file
```
if (hour === 0 && minute === 3) {
    logging("info", `hour:${hour} - minute: ${minute}`);

    await checkTokens();
}
```
- If account available balance (USDT) greather than budget (which set in .env file) system will use budget to calculate order's budget and versary