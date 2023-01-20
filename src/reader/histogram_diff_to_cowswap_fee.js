import { UNION_RAW_DATA_LOW_GAS, UNION_RAW_DATA_HIGH_GAS } from "./shared.js";
export function display_histogram_winners_diff_to_cowswap_fee(db) {
  const query = `
      raw_data_filtered as (
      select * from raw_data where executed_buy_amount != 0 or name='cowswap'
      ),
      ranked_by_ouput as(
      select uid, gas_cost_usd, name,

       rank() over( partition by uid order by output_value_usd DESC ) as rank
       from raw_data_filtered
      ),
      winner as (
      select * from ranked_by_ouput where rank=1
      ),
      input_count as (
      select uid, count(*) as number_of_inputs from raw_data_filtered group by uid
      ),
      difference_to_cowswap as(
      select ro.uid, w.gas_cost_usd - ro.gas_cost_usd as diff from ranked_by_ouput ro left join winner w on ro.uid = w.uid left join input_count ic on ro.uid = ic.uid
      where ro.name='cowswap' and number_of_inputs > 2
      ),
      winner_count as (
       select '[-10,-1]' as category, count(*) from difference_to_cowswap where diff<-1 and diff > -10
       UNION
       select '[-1,0]' as category, count(*) from difference_to_cowswap where diff<0 and diff > -1
       UNION
       select '[0,0]' as category, count(*) from difference_to_cowswap where diff=0
       UNION
       select '[0,0.001]' as category, count(*) from difference_to_cowswap where diff < 0.001 and diff >0
       UNION
       select '[0.001,0.01]' as category, count(*) from difference_to_cowswap where diff > 0.001 and diff < 0.01
       UNION
       select '[0.01,0.1]' as category, count(*) from difference_to_cowswap where diff > 0.01 and diff < 0.1
       UNION
       select '[0.1,1]' as category, count(*) from difference_to_cowswap where diff > 0.1 and diff < 1
       UNION
       select '[1,2]' as category, count(*) from difference_to_cowswap where diff >1 and diff < 2
       UNION
       select '[2,4]' as category, count(*) from difference_to_cowswap where diff >2 and diff < 4
       UNION
       select '[4,10]' as category, count(*) from difference_to_cowswap where diff >4 and diff < 10
       UNION
       select '[10,10000]' as category, count(*) from difference_to_cowswap where diff >10 
       )
      select * from winner_count
      `;
  let rows = db.query(
    UNION_RAW_DATA_LOW_GAS + query,
    [],
  );
  console.log(
    "Histogram of gas cost difference [usd] between cowswap and best price provider(in low gas cost env):",
  );
  let x_val = [];
  let labels = [];
  for (let i = 0; i < rows.length; i++) {
    x_val.push(rows[i][1]);
    labels.push(rows[i][0]);
  }
  console.log(rows)
  console.log(x_val);
  console.log(labels);
  rows = db.query(
    UNION_RAW_DATA_HIGH_GAS + query,
    [],
  );
  console.log(
    "Histogram of gas cost difference [usd] between cowswap and best price provider(in high gas cost env):",
  );
  x_val = [];
  labels = [];
  for (let i = 0; i < rows.length; i++) {
    x_val.push(rows[i][1]);
    labels.push(rows[i][0]);
  }
  console.log(rows)
  console.log(x_val);
  console.log(labels);
}
