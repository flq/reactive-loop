# assign

    import { assign } from "reax";
    assign(s(), { moreState: "yes" });

The `assign` provided by reax pretty much just wraps the implementation provided by **lodash**, but ensures that the starting object is an empty one **({})**, thereby guaranteeing that the next state object is a new one, leaving the previous state intact.